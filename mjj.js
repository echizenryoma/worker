addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  // HTML 表单
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MJJ图床</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f4f4f4;
      }
      
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      
      .form-container {
        text-align: center;
        margin-bottom: 20px;
      }
      
      input[type="file"] {
        display: none;
      }
      
      .custom-file-upload {
        display: inline-block;
        padding: 12px 24px;
        cursor: pointer;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        transition: background-color 0.3s ease;
      }
      
      .custom-file-upload:hover {
        background-color: #45a049;
      }
      
      #result {
        text-align: center;
        margin-bottom: 20px;
      }
      
      #links {
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        margin-bottom: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        resize: none;
      }
      
      #interfaceSelector {
        text-align: center;
        margin-bottom: 20px;
      }
      
      #interfaceSelector select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        background-color: white;
        font-size: 16px;
      }
      
      .copy-button {
        margin-right: 10px;
      }
  
      .success-message {
        text-align: center;
        margin-top: 10px;
        color: green;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div id="interfaceSelector">
        <select id="interfaceSelect">
          <option value="api1">美团≤20MB</option>
          <option value="api2">TCL≤10MB</option>
        </select>
      </div>
      <div class="form-container">
        <label for="file" class="custom-file-upload">选择文件</label>
        <input type="file" id="file" name="file" required>
      </div>
      <div id="result"></div>
      <textarea id="links" rows="4" readonly></textarea>
      <button id="urlButton" class="copy-button">URL</button>
      <button id="bbcodeButton" class="copy-button">BBCode</button>
      <button id="markdownButton" class="copy-button">Markdown</button>
      <div id="copySuccessMessage" class="success-message" style="display: none;">链接已成功复制！</div>
    </div>
    <script>
      let originalImageURL = '';
      let selectedInterface = 'api1';
  
      document.getElementById('file').addEventListener('change', async function(event) {
        const formData = new FormData();
        formData.append('file', event.target.files[0]);
        try {
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
            headers: { 'X-Interface': selectedInterface }
          });
          const data = await response.json();
          if (response.ok) {
            const imageURL = data.data.replace('http://', 'https://');
            originalImageURL = imageURL;
            document.getElementById('result').innerText = '上传成功！';
            document.getElementById('links').value = imageURL;
            // 文件上传成功后重置文件选择表单
            document.getElementById('file').value = '';
          } else {
            document.getElementById('result').innerText = '上传失败，请重试。';
          }
        } catch (error) {
          console.error('Error:', error);
          document.getElementById('result').innerText = '上传失败，请重试。';
        }
      });
  
      document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
          // 检查文本框内容是否为空
          if (originalImageURL !== '') {
            const textToCopy = getTextToCopy(this.id);
            copyToClipboard(textToCopy);
          } else {
            // 如果文本框内容为空，则不触发复制操作
            console.log('文本框内容为空，无法复制。');
          }
        });
      });      
  
      document.getElementById('interfaceSelect').addEventListener('change', function() {
        selectedInterface = this.value;
        const fileInput = document.getElementById('file');
        if (selectedInterface === 'api1') {
          fileInput.accept = 'images/*';
        } else if (selectedInterface === 'api2') {
          fileInput.accept = '.jpg,.png,.jpeg,.heic,.mp4,.mov';
        }
      });
  
      function getTextToCopy(buttonId) {
        switch (buttonId) {
          case 'urlButton':
            return originalImageURL;
          case 'bbcodeButton':
            return '[img]' + originalImageURL + '[/img]';
          case 'markdownButton':
            return '![image](' + originalImageURL + ')';
          default:
            return '';
        }
      }
  
      function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
          .then(() => {
            console.log('Text copied to clipboard');
            document.getElementById('links').value = text; // 更新文本展示框内容
            showCopySuccessMessage(); // 显示复制成功的提示信息
          })
          .catch(err => {
            console.error('Unable to copy text to clipboard:', err);
          });
      }
  
      function showCopySuccessMessage() {
        const copySuccessMessage = document.getElementById('copySuccessMessage');
        copySuccessMessage.style.display = 'block'; // 显示提示信息
        setTimeout(() => {
          copySuccessMessage.style.display = 'none'; // 一定时间后隐藏提示信息
        }, 500); // 0.5秒后隐藏
      }
    </script>
  </body>
  </html>

  `;

  // 如果请求根路径，则返回 HTML 表单
  if (pathname === '/') {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }

  // 如果请求上传路径并且是 POST 方法，则处理上传请求
  if (pathname === '/upload' && request.method === 'POST') {
    return handleUpload(request);
  }

  // 其他情况返回 404
  return new Response('Not Found', { status: 404 });
}

// 处理上传请求
async function handleUpload(request) {
  try {
    // 获取上传图片数据
    const formData = await request.formData();
    
    // 获取请求头中的接口选择信息
    const selectedInterface = request.headers.get('X-Interface');

    // 构建上传请求
    let uploadURL = '';
    if (selectedInterface === 'api1') {
      uploadURL = 'https://kf.dianping.com/api/file/singleImage';
    } else if (selectedInterface === 'api2') {
      uploadURL = 'https://service2.tcl.com/api.php/Center/uploadQiniu';
    }

    const uploadRequest = new Request(uploadURL, {
      method: 'POST',
      body: formData,
      headers: {
        'Referer': 'https://h5.dianping.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
      },
    });

    // 发送上传请求
    const response = await fetch(uploadRequest);

    // 检查上传是否成功
    if (response.ok) {
      // 如果是接口1，返回JSON数据
      if (selectedInterface === 'api1') {
        const responseData = await response.json();
        return new Response(JSON.stringify({ data: responseData.data.uploadPath.replace('http://', 'https://') }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      // 如果是接口2，解析并返回数据
      else if (selectedInterface === 'api2') {
        const responseData = await response.json();
        if (responseData && responseData.code === 1 && responseData.data) {
          const imageURL = responseData.data;
          return new Response(JSON.stringify({ data: imageURL }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
          return new Response('Upload Failed - Invalid Response Data', { status: 500 });
        }
      }
    } else {
      return new Response('Upload Failed - Server Error', { status: 500 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
