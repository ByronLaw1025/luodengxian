const API_KEY = 'sk-d74b8b308794405ba3fe837cbb3f1453';
const APP_ID = '7470cb29da5e4415b4d1e4aab21b99ce';
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/apps/'+APP_ID+'/completion';

// 初始化消息历史
let messageHistory = [];

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

    // 添加用户消息到历史记录
    messageHistory.push({ role: "user", content: message });

    // 显示用户消息
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user';
    userMessageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(userMessageDiv);
    userInput.value = '';

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 创建AI回复的消息元素
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message';
    aiMessageDiv.innerHTML = '<div class="message-content"><span class="ai-response"></span></div>';
    chatMessages.appendChild(aiMessageDiv);
    const aiResponseSpan = aiMessageDiv.querySelector('.ai-response');

    chatMessages.scrollTop = chatMessages.scrollHeight;

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
                    messages: messageHistory  // 发送完整的对话历史
                },
                parameters: {
                    incremental_output: true
                },
                debug: {}
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    try {
                        const data = JSON.parse(line.slice(5));
                        if (data.output && data.output.text) {
                            accumulatedResponse += data.output.text;
                            aiResponseSpan.textContent = accumulatedResponse;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析SSE数据失败:', e);
                    }
                }
            }
        }

        // 将AI回复添加到历史记录
        messageHistory.push({ role: "assistant", content: accumulatedResponse });

    } catch (error) {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message';
        errorDiv.innerHTML = '<div class="message-content" style="color: #ff4444;">发送消息失败，请稍后重试。</div>';
        chatMessages.appendChild(errorDiv);
    }
}

// 添加回车发送功能
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});