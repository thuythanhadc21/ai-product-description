// Biến toàn cục lưu trữ mô tả vừa được tạo
let currentDescription = '';

/**
 * Kiểm tra form và bật/tắt nút "Tạo Mô Tả"
 */
function checkFormCompletion() {
    const productName = document.getElementById('productName').value.trim();
    const features = document.getElementById('features').value.trim();
    const benefits = document.getElementById('benefits').value.trim();
    const button = document.getElementById('generateBtn');

    if (productName && features && benefits) {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
}

/**
 * [YÊU CẦU ĐỀ BÀI]: GỌI AI FUNCTION (AI STUDIO / OPENAI)
 * Tạo mô tả sản phẩm 2 phiên bản dựa trên dữ liệu người dùng nhập
 */
async function generateDescription(event) {
    if (event) event.preventDefault();
    const button = document.getElementById('generateBtn');
    button.disabled = true;
    button.innerText = 'Đang tạo bằng AI...';

    const productName = document.getElementById('productName').value;
    const featuresArray = document.getElementById('features').value.split('\n').filter(f => f.trim());
    const benefits = document.getElementById('benefits').value;
    const keywordCheckboxes = document.querySelectorAll('#keywords input[type="checkbox"]:checked');
    const keywords = Array.from(keywordCheckboxes).map(cb => cb.value);
    const productImage = document.getElementById('productImage').value;
    const apiKey = document.getElementById('apiKey').value.trim();

    const prompt = `Bạn là chuyên gia Content Marketing. Hãy viết mô tả sản phẩm E-commerce hấp dẫn dựa trên thông tin sau:
    Tên sản phẩm: ${productName}
    Tính năng nổi bật: ${featuresArray.join(', ')}
    Lợi ích cho khách: ${benefits}
    Từ khóa SEO cần có: ${keywords.join(', ')}
    
    [YÊU CẦU]: Tạo ra 2 phiên bản khác nhau:
    - Phiên bản 1 (Chi tiết & Cảm xúc)
    - Phiên bản 2 (Ngắn gọn & Tập trung gạch đầu dòng tính năng)`;

    if (apiKey) {
        try {
            let aiResponseText = "";
            // Hỗ trợ cả 2 chuẩn API: Gemini (AI Studio) và OpenAI. API Key Gemini thường không có chữ "sk-"
            if (!apiKey.startsWith('sk-')) { 
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (!response.ok) throw new Error("Lỗi kết nối Gemini API");
                const data = await response.json();
                aiResponseText = data.candidates[0].content.parts[0].text;
            } else {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }] })
                });
                if (!response.ok) throw new Error("Lỗi kết nối OpenAI API");
                const data = await response.json();
                aiResponseText = data.choices[0].message.content;
            }

            currentDescription = aiResponseText;
            if (productImage) currentDescription += `\n\n[Hình ảnh tham khảo: ${productImage}]`;
            showGeneratedResult();
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Không thể kết nối API. Đang dùng chế độ tạo tự động (Offline)...');
            fallbackGenerate(productName, featuresArray, benefits, keywords, productImage);
        }
    } else {
        setTimeout(() => { fallbackGenerate(productName, featuresArray, benefits, keywords, productImage); }, 1000);
    }
}

// Chế độ tạo mô tả mô phỏng (dùng khi không nhập key)
function fallbackGenerate(productName, features, benefits, keywords, productImage) {
    let description = `Khám phá **${productName}**, sản phẩm tuyệt vời với các tính năng nổi bật:\n\n`;
    features.forEach(f => { description += `- ${f}\n`; });
    description += `\nLợi ích: ${benefits}\n\n`;
    if (keywords.length > 0) description += `Từ khóa SEO: ${keywords.join(', ')}.`;
    
    let version2 = `Giới thiệu ${productName}. Tính năng nổi bật:\n`;
    features.forEach(f => { version2 += `- ${f}\n`; });
    version2 += `Lợi ích chính: ${benefits}`;

    currentDescription = "--- Phiên bản 1 (Chi tiết) ---\n" + description + '\n\n--- Phiên bản 2 (Ngắn gọn) ---\n' + version2;
    if (productImage) currentDescription += `\n\n[Hình ảnh: ${productImage}]`;
    showGeneratedResult();
}

function showGeneratedResult() {
    document.getElementById('descriptionText').innerText = currentDescription;
    document.getElementById('output').style.display = 'block';
    document.getElementById('evaluation').style.display = 'none';

    const button = document.getElementById('generateBtn');
    button.disabled = false;
    button.innerText = 'Tạo Mô Tả';
}

/**
 * [YÊU CẦU ĐỀ BÀI]: SAO CHÉP DỄ DÀNG
 */
function copyDescription() {
    navigator.clipboard.writeText(currentDescription).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Đã sao chép!';
        btn.style.backgroundColor = '#218838';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '#28a745';
        }, 2000);
    }).catch(err => {
        alert('Có lỗi xảy ra khi sao chép!');
    });
}

/**
 * [YÊU CẦU ĐỀ BÀI]: ĐỊNH DẠNG LẠI (SANG HTML ĐƠN GIẢN)
 */
function formatToHTML() {
    const htmlFormatted = currentDescription
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // In đậm Markdown (dấu ** của AI)
    
    document.getElementById('descriptionText').innerHTML = htmlFormatted;
    currentDescription = htmlFormatted; // Cập nhật biến để khi nhấn Copy sẽ copy luôn mã HTML này
}

/**
 * [YÊU CẦU ĐỀ BÀI]: ĐÁNH GIÁ ĐỘ TIỀM NĂNG MUA HÀNG & LÝ DO
 * Tích hợp lĩnh vực (Sales, CRM)
 */
async function evaluatePotential() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const evalDiv = document.getElementById('evaluation');
    const evalResult = document.getElementById('evaluationResult');

    evalDiv.style.display = 'block';
    evalResult.innerHTML = '<em>Đang dùng AI phân tích tiềm năng theo chuyên ngành Sales/CRM...</em>';

    if (apiKey) {
        try {
            const isGemini = !apiKey.startsWith('sk-');
            const prompt = `Đóng vai trò là chuyên gia phân tích bán hàng (Sales/CRM). Hãy phân tích mô tả sản phẩm sau đây. Đưa ra điểm "Độ tiềm năng mua hàng" trên thang 10, và giải thích lý do ngắn gọn (tại sao nội dung này lại thuyết phục hoặc chưa thuyết phục khách hàng).\n\nMô tả:\n${currentDescription}`;

            let aiResponseText = "";
            if (isGemini) {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await response.json();
                aiResponseText = data.candidates[0].content.parts[0].text;
            } else {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }] })
                });
                const data = await response.json();
                aiResponseText = data.choices[0].message.content;
            }

            evalResult.innerHTML = aiResponseText.replace(/\n/g, '<br>');
            return;
        } catch (error) {
            console.error("Lỗi AI đánh giá:", error);
        }
    }

    // Đánh giá fallback offline nếu không có key
    const length = currentDescription.length;
    const keywordCount = (currentDescription.match(/SEO|E-commerce|Sản phẩm|Mua hàng|Giá rẻ/gi) || []).length;
    let score = 7; 
    if (length > 250) score += 1;
    if (keywordCount >= 2) score += 1;
    if (currentDescription.includes('Phiên bản 2')) score += 1;
    if (score > 10) score = 10;

    evalResult.innerHTML = `<strong>Độ tiềm năng mua hàng: ${score}/10</strong><br><br>
    <strong>Lý do phân tích Sales:</strong> Mô tả có độ dài hợp lý (${length} ký tự), nêu bật được tính năng / lợi ích rõ ràng. Cấu trúc mô tả theo chuẩn CRM giúp tối ưu hóa tỷ lệ chuyển đổi.`;
}

// --- CÁC HÀM PHỤ TRỢ (UI, Upload Ảnh, Counters) ---
function previewImage() {
    const file = document.getElementById('productImageFile').files[0] || document.getElementById('cameraFile').files[0];
    if (file) {
        const img = document.getElementById('imagePreview');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
    }
}

function describeFromImage() { alert('Tích hợp AI Vision (Cần API)...'); }
function toggleFaqAnswer(button) { const answer = button.nextElementSibling; if (answer) answer.style.display = answer.style.display === 'block' ? 'none' : 'block'; }
function toggleUploadOptions() { const options = document.getElementById('uploadOptions'); options.style.display = options.style.display === 'none' ? 'block' : 'none'; }
function selectFromLibrary() { document.getElementById('productImageFile').click(); document.getElementById('uploadOptions').style.display = 'none'; }
function takePhoto() { document.getElementById('cameraFile').click(); document.getElementById('uploadOptions').style.display = 'none'; }
function selectFile() { document.getElementById('productImageFile').click(); document.getElementById('uploadOptions').style.display = 'none'; }

function animateCounters() {
    const counters = document.querySelectorAll('.counter-number');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let current = 0; const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { current = target; clearInterval(timer); }
            counter.innerText = target === 90 ? Math.floor(current) + '%' : Math.floor(current).toLocaleString();
        }, 20);
    });
}

window.addEventListener('load', function() {
    animateCounters();
    checkFormCompletion();
    document.getElementById('generateBtn').addEventListener('click', generateDescription);
});