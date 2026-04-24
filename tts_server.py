#!/usr/bin/env python3
"""Local Edge TTS server with CORS support"""
import asyncio
import edge_tts
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import io
import threading

class TTSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != '/tts':
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        text = params.get('text', [''])[0]
        voice = params.get('voice', ['zh-CN-XiaoxiaoNeural'])[0]
        rate = params.get('rate', ['+0%'])[0]
        pitch = params.get('pitch', ['+0Hz'])[0]

        if not text:
            self.send_response(400)
            self.end_headers()
            return

        try:
            audio_data = asyncio.run(self._synthesize(text, voice, rate, pitch))
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET')
            self.send_header('Content-Length', str(len(audio_data)))
            self.end_headers()
            self.wfile.write(audio_data)
        except Exception as e:
            print(f"TTS Error: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    async def _synthesize(self, text, voice, rate, pitch):
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        return buf.getvalue()

    def log_message(self, format, *args):
        print(f"[TTS] {args[0]}")

if __name__ == '__main__':
    port = 8766
    server = HTTPServer(('localhost', port), TTSHandler)
    print(f"Edge TTS Server running on http://localhost:{port}/tts")
    print("Voices: zh-CN-XiaoxiaoNeural, zh-CN-YunxiNeural, zh-CN-YunyangNeural, zh-CN-YunjianNeural")
    server.serve_forever()
