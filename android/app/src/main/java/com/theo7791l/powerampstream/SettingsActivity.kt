package com.theo7791l.powerampstream

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val prefs = getSharedPreferences("settings", 0)
        val urlInput = findViewById<EditText>(R.id.input_backend_url)
        val saveBtn = findViewById<Button>(R.id.btn_save)
        val testBtn = findViewById<Button>(R.id.btn_test)
        val statusText = findViewById<TextView>(R.id.tv_status)

        urlInput.setText(prefs.getString("backend_url", BuildConfig.BACKEND_URL))

        saveBtn.setOnClickListener {
            val url = urlInput.text.toString().trimEnd('/')
            prefs.edit().putString("backend_url", url).apply()
            Toast.makeText(this, "URL sauvegardée !", Toast.LENGTH_SHORT).show()
        }

        testBtn.setOnClickListener {
            val url = urlInput.text.toString().trimEnd('/')
            statusText.text = "Test en cours..."
            val client = OkHttpClient()
            val req = Request.Builder().url("$url/health").build()
            client.newCall(req).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    runOnUiThread { statusText.text = "❌ Erreur : ${e.message}" }
                }
                override fun onResponse(call: Call, response: Response) {
                    runOnUiThread {
                        if (response.isSuccessful)
                            statusText.text = "✅ Backend connecté !"
                        else
                            statusText.text = "❌ Code ${response.code}"
                    }
                }
            })
        }
    }
}
