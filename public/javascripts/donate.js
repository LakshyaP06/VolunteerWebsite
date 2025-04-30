document.getElementById('donate-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // 显示感谢消息
    document.getElementById('message').textContent = `Thank you, ${name}, for your generous donation of $${amount}!`;

    // 发送感谢邮件
    fetch('/send-thank-you-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, amount, email })
    }).then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

    // 重置表单
    document.getElementById('donate-form').reset();
});

document.getElementById('notify-button').addEventListener('click', function() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // 检查是否填写了姓名和电子邮件
    if (!name || !email) {
        alert('Please fill out your name and email before sending a notification.');
        return;
    }

    // 发送通知邮件
    fetch('/send-notification-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
    }).then(response => response.json())
        .then(data => {
            if (data.message) {
                document.getElementById('message').textContent = data.message;
            }
        })
        .catch(error => console.error('Error:', error));
});
