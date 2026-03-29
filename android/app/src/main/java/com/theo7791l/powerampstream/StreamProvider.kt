package com.theo7791l.powerampstream

import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.DocumentsContract
import android.provider.DocumentsContract.Document
import android.provider.DocumentsProvider
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class StreamProvider : DocumentsProvider() {

    companion object {
        private const val TAG = "StreamProvider"
        private val ROOT_PROJECTION = arrayOf(
            "root_id", "title", "summary", "flags", "mime_types", "document_id"
        )
        private val DOCUMENT_PROJECTION = arrayOf(
            Document.COLUMN_DOCUMENT_ID,
            Document.COLUMN_MIME_TYPE,
            Document.COLUMN_DISPLAY_NAME,
            Document.COLUMN_LAST_MODIFIED,
            Document.COLUMN_FLAGS,
            Document.COLUMN_SIZE,
            "track_number",
            "duration",
            "artist",
            "album",
            "album_art",
            "url"
        )
        private const val MIME_AUDIO = "audio/mpeg"
        private val MIME_DIR = DocumentsContract.Document.MIME_TYPE_DIR
    }

    private val executor = Executors.newCachedThreadPool()

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private fun backendUrl(): String =
        context!!.getSharedPreferences("settings", 0)
            .getString("backend_url", BuildConfig.BACKEND_URL) ?: BuildConfig.BACKEND_URL

    private fun getJson(path: String): JSONObject? {
        return try {
            val req = Request.Builder().url("${backendUrl()}$path").build()
            val res = client.newCall(req).execute()
            if (res.isSuccessful) JSONObject(res.body!!.string()) else null
        } catch (e: Exception) {
            Log.e(TAG, "GET $path failed: ${e.message}")
            null
        }
    }

    private fun getJsonArray(path: String): JSONArray? {
        return try {
            val req = Request.Builder().url("${backendUrl()}$path").build()
            val res = client.newCall(req).execute()
            if (res.isSuccessful) JSONArray(res.body!!.string()) else null
        } catch (e: Exception) {
            Log.e(TAG, "GET $path failed: ${e.message}")
            null
        }
    }

    override fun onCreate(): Boolean = true

    override fun queryRoots(projection: Array<out String>?): Cursor {
        val cursor = MatrixCursor(ROOT_PROJECTION)
        cursor.newRow().apply {
            add("root_id", "poweramp_stream_root")
            add("title", "Poweramp Stream")
            add("summary", "Spotify via YouTube")
            add("flags", 0)
            add("mime_types", MIME_AUDIO)
            add("document_id", "root")
        }
        return cursor
    }

    override fun queryChildDocuments(
        parentDocumentId: String,
        projection: Array<out String>?,
        sortOrder: String?
    ): Cursor {
        val cursor = MatrixCursor(DOCUMENT_PROJECTION)
        when {
            parentDocumentId == "root" -> {
                cursor.newRow().apply {
                    add(Document.COLUMN_DOCUMENT_ID, "dir:search:top+tracks")
                    add(Document.COLUMN_MIME_TYPE, MIME_DIR)
                    add(Document.COLUMN_DISPLAY_NAME, "Rechercher")
                    add(Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
                    add(Document.COLUMN_FLAGS, 0)
                    add(Document.COLUMN_SIZE, 0)
                    add("track_number", 0)
                    add("duration", 0)
                    add("artist", "")
                    add("album", "")
                    add("album_art", "")
                    add("url", "")
                }
                cursor.newRow().apply {
                    add(Document.COLUMN_DOCUMENT_ID, "dir:featured")
                    add(Document.COLUMN_MIME_TYPE, MIME_DIR)
                    add(Document.COLUMN_DISPLAY_NAME, "Titres populaires")
                    add(Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
                    add(Document.COLUMN_FLAGS, 0)
                    add(Document.COLUMN_SIZE, 0)
                    add("track_number", 0)
                    add("duration", 0)
                    add("artist", "")
                    add("album", "")
                    add("album_art", "")
                    add("url", "")
                }
            }
            parentDocumentId.startsWith("dir:featured") -> {
                val tracks = getJsonArray("/spotify/search?q=top+hits+2025")
                tracks?.let { addTracksFromArray(cursor, it) }
            }
            parentDocumentId.startsWith("dir:search:") -> {
                val query = parentDocumentId.removePrefix("dir:search:").replace("+", " ")
                val tracks = getJsonArray("/spotify/search?q=${Uri.encode(query)}")
                tracks?.let { addTracksFromArray(cursor, it) }
            }
            parentDocumentId.startsWith("playlist:") -> {
                val playlistId = parentDocumentId.removePrefix("playlist:")
                val tracks = getJsonArray("/spotify/playlist/$playlistId")
                tracks?.let { addTracksFromArray(cursor, it) }
            }
            parentDocumentId.startsWith("album:") -> {
                val albumId = parentDocumentId.removePrefix("album:")
                val tracks = getJsonArray("/spotify/album/$albumId")
                tracks?.let { addTracksFromArray(cursor, it) }
            }
        }
        return cursor
    }

    private fun addTracksFromArray(cursor: MatrixCursor, tracks: JSONArray) {
        for (i in 0 until tracks.length()) {
            runCatching {
                val track = tracks.getJSONObject(i)
                val trackId = track.optString("id")
                if (trackId.isEmpty()) return@runCatching
                val name = track.optString("name", "Inconnu")
                val artist = track.optJSONArray("artists")
                    ?.optJSONObject(0)?.optString("name") ?: ""
                val albumObj = track.optJSONObject("album")
                val album = albumObj?.optString("name") ?: ""
                val albumArt = albumObj?.optJSONArray("images")
                    ?.optJSONObject(0)?.optString("url") ?: ""
                val durationMs = track.optLong("duration_ms", 0)
                val trackNumber = track.optInt("track_number", 0)

                cursor.newRow().apply {
                    add(Document.COLUMN_DOCUMENT_ID, "track:$trackId")
                    add(Document.COLUMN_MIME_TYPE, MIME_AUDIO)
                    add(Document.COLUMN_DISPLAY_NAME, "$artist - $name")
                    add(Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
                    add(Document.COLUMN_FLAGS, 0)
                    add(Document.COLUMN_SIZE, 0)
                    add("track_number", trackNumber)
                    add("duration", durationMs)
                    add("artist", artist)
                    add("album", album)
                    add("album_art", albumArt)
                    add("url", "${backendUrl()}/stream/proxy/$trackId")
                }
            }
        }
    }

    override fun queryDocument(documentId: String, projection: Array<out String>?): Cursor {
        val cursor = MatrixCursor(DOCUMENT_PROJECTION)
        if (documentId.startsWith("track:")) {
            val trackId = documentId.removePrefix("track:")
            val track = getJson("/spotify/track/$trackId")
            track?.let {
                val name = it.optString("name", "Inconnu")
                val artist = it.optJSONArray("artists")
                    ?.optJSONObject(0)?.optString("name") ?: ""
                val albumObj = it.optJSONObject("album")
                val album = albumObj?.optString("name") ?: ""
                val albumArt = albumObj?.optJSONArray("images")
                    ?.optJSONObject(0)?.optString("url") ?: ""
                val durationMs = it.optLong("duration_ms", 0)
                cursor.newRow().apply {
                    add(Document.COLUMN_DOCUMENT_ID, documentId)
                    add(Document.COLUMN_MIME_TYPE, MIME_AUDIO)
                    add(Document.COLUMN_DISPLAY_NAME, "$artist - $name")
                    add(Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
                    add(Document.COLUMN_FLAGS, 0)
                    add(Document.COLUMN_SIZE, 0)
                    add("track_number", 0)
                    add("duration", durationMs)
                    add("artist", artist)
                    add("album", album)
                    add("album_art", albumArt)
                    add("url", "${backendUrl()}/stream/proxy/$trackId")
                }
            }
        } else {
            // Pour les dossiers (dir:*)
            cursor.newRow().apply {
                add(Document.COLUMN_DOCUMENT_ID, documentId)
                add(Document.COLUMN_MIME_TYPE, MIME_DIR)
                add(Document.COLUMN_DISPLAY_NAME, documentId)
                add(Document.COLUMN_LAST_MODIFIED, System.currentTimeMillis())
                add(Document.COLUMN_FLAGS, 0)
                add(Document.COLUMN_SIZE, 0)
                add("track_number", 0)
                add("duration", 0)
                add("artist", "")
                add("album", "")
                add("album_art", "")
                add("url", "")
            }
        }
        return cursor
    }

    override fun openDocument(
        documentId: String,
        mode: String,
        signal: CancellationSignal?
    ): ParcelFileDescriptor {
        if (!documentId.startsWith("track:")) throw IOException("Not a track: $documentId")
        val trackId = documentId.removePrefix("track:")
        val proxyUrl = "${backendUrl()}/stream/proxy/$trackId"

        val pipes = ParcelFileDescriptor.createPipe()
        executor.submit {
            try {
                val req = Request.Builder().url(proxyUrl).build()
                val res = client.newCall(req).execute()
                if (!res.isSuccessful) {
                    Log.e(TAG, "Proxy returned ${res.code} for $proxyUrl")
                    pipes[1].close()
                    return@submit
                }
                ParcelFileDescriptor.AutoCloseOutputStream(pipes[1]).use { out ->
                    res.body?.byteStream()?.copyTo(out)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Stream error for $trackId: ${e.message}")
                runCatching { pipes[1].close() }
            }
        }
        return pipes[0]
    }

    override fun isChildDocument(parentDocumentId: String, documentId: String) = true
}
