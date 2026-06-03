(function () {
    'use strict';

    const DEFAULT_LOGO = 'logos/star-moon-logo-right.png';
    const DEFAULT_LOGO_NAME = 'star-moon-logo-right.png';

    let currentType = 'url';
    let logoDataUrl = DEFAULT_LOGO;
    let qrCode = null;

    const contentTypeGrid = document.getElementById('contentTypeGrid');
    const contentFields = document.getElementById('contentFields');
    const qrPreview = document.getElementById('qrPreview');
    const previewUrl = document.getElementById('previewUrl');

    const colorFg = document.getElementById('colorFg');
    const colorFgHex = document.getElementById('colorFgHex');
    const colorBg = document.getElementById('colorBg');
    const colorBgHex = document.getElementById('colorBgHex');
    const gradientToggle = document.getElementById('gradientToggle');
    const gradientOptions = document.getElementById('gradientOptions');
    const gradientEnd = document.getElementById('gradientEnd');
    const gradientEndHex = document.getElementById('gradientEndHex');
    const gradientDirection = document.getElementById('gradientDirection');

    const dotShapeOptions = document.getElementById('dotShapeOptions');
    const cornerSquareOptions = document.getElementById('cornerSquareOptions');
    const cornerDotOptions = document.getElementById('cornerDotOptions');

    const uploadBtn = document.getElementById('uploadBtn');
    const logoFileInput = document.getElementById('logoFileInput');
    const logoLoaded = document.getElementById('logoLoaded');
    const logoPreviewThumb = document.getElementById('logoPreviewThumb');
    const logoFileName = document.getElementById('logoFileName');
    const logoRemoveBtn = document.getElementById('logoRemoveBtn');
    const logoSize = document.getElementById('logoSize');
    const logoSizeValue = document.getElementById('logoSizeValue');
    const logoPadding = document.getElementById('logoPadding');
    const logoPaddingValue = document.getElementById('logoPaddingValue');

    const scoreBadge = document.getElementById('scoreBadge');
    const scoreBarFill = document.getElementById('scoreBarFill');

    const downloadSize = document.getElementById('downloadSize');

    contentTypeGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.type-btn');
        if (!btn) return;

        contentTypeGrid.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;

        contentFields.querySelectorAll('.field-group').forEach(fg => {
            fg.classList.toggle('hidden', fg.dataset.field !== currentType);
        });

        renderQR();
    });

    document.querySelectorAll('.panel-header[data-collapse]').forEach(header => {
        header.addEventListener('click', function () {
            const body = header.nextElementSibling;
            const icon = header.querySelector('.collapse-icon');
            body.classList.toggle('collapsed');
            icon.classList.toggle('collapsed');
        });
    });

    function syncColor(picker, hexInput) {
        picker.addEventListener('input', () => {
            hexInput.value = picker.value.toUpperCase();
            renderQR();
        });
        hexInput.addEventListener('input', () => {
            const val = hexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                picker.value = val;
                renderQR();
            }
        });
        hexInput.addEventListener('blur', () => {
            hexInput.value = picker.value.toUpperCase();
        });
    }

    syncColor(colorFg, colorFgHex);
    syncColor(colorBg, colorBgHex);
    syncColor(gradientEnd, gradientEndHex);

    gradientToggle.addEventListener('change', () => {
        gradientOptions.classList.toggle('hidden', !gradientToggle.checked);
        renderQR();
    });

    gradientDirection.addEventListener('change', renderQR);

    function setupStyleOptions(container, callback) {
        container.addEventListener('click', function (e) {
            const btn = e.target.closest('.style-btn');
            if (!btn) return;
            container.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (callback) callback();
            renderQR();
        });
    }

    setupStyleOptions(dotShapeOptions);
    setupStyleOptions(cornerSquareOptions);
    setupStyleOptions(cornerDotOptions);

    uploadBtn.addEventListener('click', () => logoFileInput.click());

    document.getElementById('presetLogo1').addEventListener('click', () => {
        setLogo(DEFAULT_LOGO, DEFAULT_LOGO_NAME);
    });

    logoFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            setLogo(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    });

    function setLogo(imageSrc, name) {
        logoDataUrl = imageSrc;
        logoPreviewThumb.src = imageSrc;
        logoFileName.textContent = name;
        logoLoaded.classList.remove('hidden');
        renderQR();
    }

    logoRemoveBtn.addEventListener('click', () => {
        logoDataUrl = null;
        logoLoaded.classList.add('hidden');
        logoFileInput.value = '';
        renderQR();
    });

    logoSize.addEventListener('input', () => {
        logoSizeValue.textContent = logoSize.value + '%';
        renderQR();
    });

    logoPadding.addEventListener('input', () => {
        logoPaddingValue.textContent = logoPadding.value + 'px';
        renderQR();
    });

    function getEncodedData() {
        switch (currentType) {
            case 'url':
                return document.getElementById('inputUrl').value || 'https://example.com';
            case 'text':
                return document.getElementById('inputText').value || 'Hello World';
            case 'email': {
                const to = document.getElementById('inputEmailTo').value;
                const subject = document.getElementById('inputEmailSubject').value;
                const body = document.getElementById('inputEmailBody').value;
                let mailto = `mailto:${to}`;
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                if (params.length) mailto += '?' + params.join('&');
                return mailto;
            }
            case 'phone':
                return `tel:${document.getElementById('inputPhone').value}`;
            case 'sms': {
                const phone = document.getElementById('inputSmsPhone').value;
                const msg = document.getElementById('inputSmsMessage').value;
                return `smsto:${phone}:${msg}`;
            }
            case 'wifi': {
                const ssid = document.getElementById('inputWifiSsid').value;
                const password = document.getElementById('inputWifiPassword').value;
                const enc = document.getElementById('inputWifiEncryption').value;
                return `WIFI:T:${enc};S:${ssid};P:${password};;`;
            }
            case 'contact': {
                const name = document.getElementById('inputContactName').value;
                const phone = document.getElementById('inputContactPhone').value;
                const email = document.getElementById('inputContactEmail').value;
                const org = document.getElementById('inputContactOrg').value;
                const url = document.getElementById('inputContactUrl').value;
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (name) vcard += `FN:${name}\n`;
                if (org) vcard += `ORG:${org}\n`;
                if (phone) vcard += `TEL:${phone}\n`;
                if (email) vcard += `EMAIL:${email}\n`;
                if (url) vcard += `URL:${url}\n`;
                vcard += 'END:VCARD';
                return vcard;
            }
            case 'location': {
                const lat = document.getElementById('inputLat').value || '0';
                const lng = document.getElementById('inputLng').value || '0';
                return `geo:${lat},${lng}`;
            }
            case 'custom':
                return document.getElementById('inputCustom').value || 'Custom Data';
            default:
                return 'https://example.com';
        }
    }

    function getDisplayText() {
        const data = getEncodedData();
        if (data.length > 60) return data.substring(0, 57) + '...';
        return data;
    }

    function getLuminance(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const linearize = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
    }

    function getContrastRatio(hex1, hex2) {
        const l1 = getLuminance(hex1);
        const l2 = getLuminance(hex2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function updateReadabilityScore() {
        const fg = colorFg.value;
        const bg = colorBg.value;
        const ratio = getContrastRatio(fg, bg);

        scoreBarFill.classList.remove('good', 'poor');
        scoreBadge.classList.remove('good', 'poor');

        if (ratio >= 7) {
            scoreBadge.textContent = 'Excellent';
            scoreBarFill.style.width = '100%';
        } else if (ratio >= 4.5) {
            scoreBadge.textContent = 'Good';
            scoreBadge.classList.add('good');
            scoreBarFill.classList.add('good');
            scoreBarFill.style.width = '65%';
        } else {
            scoreBadge.textContent = 'Poor';
            scoreBadge.classList.add('poor');
            scoreBarFill.classList.add('poor');
            scoreBarFill.style.width = Math.max(10, (ratio / 4.5) * 30) + '%';
        }
    }

    let renderTimeout = null;

    function renderQR() {
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(doRender, 80);
    }

    function doRender() {
        const data = getEncodedData();
        previewUrl.textContent = getDisplayText();

        const fgColor = colorFg.value;
        const bgColor = colorBg.value;

        const dotShape = dotShapeOptions.querySelector('.style-btn.active')?.dataset.value || 'square';
        const cornerSquare = cornerSquareOptions.querySelector('.style-btn.active')?.dataset.value || 'square';
        const cornerDot = cornerDotOptions.querySelector('.style-btn.active')?.dataset.value || 'square';

        let dotsColor = {};
        if (gradientToggle.checked) {
            const rotation = gradientDirection.value === 'horizontal' ? 0
                : gradientDirection.value === 'vertical' ? Math.PI / 2
                    : Math.PI / 4;
            dotsColor = {
                gradient: {
                    type: 'linear',
                    rotation: rotation,
                    colorStops: [
                        { offset: 0, color: fgColor },
                        { offset: 1, color: gradientEnd.value }
                    ]
                }
            };
        } else {
            dotsColor = { color: fgColor };
        }

        const options = {
            width: 300,
            height: 300,
            data: data,
            dotsOptions: {
                ...dotsColor,
                type: dotShape
            },
            backgroundOptions: {
                color: bgColor
            },
            cornersSquareOptions: {
                type: cornerSquare,
                color: fgColor
            },
            cornersDotOptions: {
                type: cornerDot,
                color: fgColor
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                imageSize: parseInt(logoSize.value) / 100,
                margin: parseInt(logoPadding.value)
            },
            qrOptions: {
                errorCorrectionLevel: 'H'
            }
        };

        if (logoDataUrl) {
            options.image = logoDataUrl;
        }

        qrPreview.innerHTML = '';

        qrCode = new QRCodeStyling(options);
        qrCode.append(qrPreview);

        updateReadabilityScore();
    }

    document.getElementById('scanBtn').addEventListener('click', function () {
        const data = getEncodedData();
        if (currentType === 'url' && data.startsWith('http')) {
            window.open(data, '_blank');
        } else {
            const popup = window.open('', '_blank', 'width=400,height=300');
            if (popup) {
                popup.document.write(`
                    <html>
                    <head><title>QR Code Content</title>
                    <style>body{font-family:Roboto,sans-serif;background:#000;color:#fff;padding:32px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
                    .content{background:#0a0a0a;border:1px solid rgba(217,82,4,0.15);border-radius:12px;padding:24px;max-width:360px;width:100%;white-space:pre-wrap;word-break:break-all;font-size:14px;line-height:1.6;}</style>
                    </head>
                    <body><div class="content">${data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></body>
                    </html>
                `);
            }
        }
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const format = this.dataset.format;
            const size = parseInt(downloadSize.value);
            downloadQR(format, size);
        });
    });

    function downloadQR(format, size) {
        const data = getEncodedData();
        const fgColor = colorFg.value;
        const bgColor = colorBg.value;

        const dotShape = dotShapeOptions.querySelector('.style-btn.active')?.dataset.value || 'square';
        const cornerSquare = cornerSquareOptions.querySelector('.style-btn.active')?.dataset.value || 'square';
        const cornerDot = cornerDotOptions.querySelector('.style-btn.active')?.dataset.value || 'square';

        let dotsColor = {};
        if (gradientToggle.checked) {
            const rotation = gradientDirection.value === 'horizontal' ? 0
                : gradientDirection.value === 'vertical' ? Math.PI / 2
                    : Math.PI / 4;
            dotsColor = {
                gradient: {
                    type: 'linear',
                    rotation: rotation,
                    colorStops: [
                        { offset: 0, color: fgColor },
                        { offset: 1, color: gradientEnd.value }
                    ]
                }
            };
        } else {
            dotsColor = { color: fgColor };
        }

        const options = {
            width: size,
            height: size,
            data: data,
            dotsOptions: {
                ...dotsColor,
                type: dotShape
            },
            backgroundOptions: {
                color: bgColor
            },
            cornersSquareOptions: {
                type: cornerSquare,
                color: fgColor
            },
            cornersDotOptions: {
                type: cornerDot,
                color: fgColor
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                imageSize: parseInt(logoSize.value) / 100,
                margin: parseInt(logoPadding.value)
            },
            qrOptions: {
                errorCorrectionLevel: 'H'
            }
        };

        if (logoDataUrl) {
            options.image = logoDataUrl;
        }

        const downloadQRCode = new QRCodeStyling(options);

        downloadQRCode.download({
            name: 'qr-code',
            extension: format
        });
    }

    const allInputs = contentFields.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
        input.addEventListener('input', renderQR);
    });

    renderQR();
})();
