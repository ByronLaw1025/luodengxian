const API_KEY = 'sk-d74b8b308794405ba3fe837cbb3f1453';
const APP_ID = '7470cb29da5e4415b4d1e4aab21b99ce';
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/apps/'+APP_ID+'/completion';

// 确保视频自动播放
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('videoPlayer');
    video.play().catch(function(error) {
        console.log("视频自动播放失败:", error);
    });
});

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chat-messages');
    const message = userInput.value.trim();
    
    if (!message) return;

    // 清空之前的对话
    chatMessages.innerHTML = '';

    // 显示用户消息
    chatMessages.innerHTML += `<p><strong>你:</strong> ${message}</p>`;
    userInput.value = '';

    // 创建AI回复的占位元素
    const aiResponseElement = document.createElement('p');
    aiResponseElement.innerHTML = '<strong>AI:</strong> <span class="ai-response"></span>';
    chatMessages.appendChild(aiResponseElement);
    const aiResponseSpan = aiResponseElement.querySelector('.ai-response');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify({
                input: {
                    prompt: message
                },
                parameters: {
                    incremental_output: true
                },
                debug: {}
            })
        });

        // 创建 TextDecoder 来处理响应流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            // 解码响应数据
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            // 处理每一行SSE数据
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    try {
                        const data = JSON.parse(line.slice(5));
                        if (data.output && data.output.text) {
                            // 更新AI回复文本
                            accumulatedResponse += data.output.text;
                            aiResponseSpan.textContent = accumulatedResponse;
                            
                            // 自动滚动到底部
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析SSE数据失败:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        chatMessages.innerHTML = `<p style="color: red;">发送消息失败，请稍后重试。</p>`;
    }
}

// 添加回车发送功能
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 