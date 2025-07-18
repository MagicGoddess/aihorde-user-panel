document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('apikey');
    const button = document.getElementById('load-info');
    const infoDiv = document.getElementById('user-info');
    const themeToggle = document.getElementById('theme-toggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌖';
        currentTheme = theme;
    }

    let currentTheme;
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

    themeToggle.addEventListener('click', function () {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    button.addEventListener('click', function () {
        const apiKey = input.value.trim();
        if (!apiKey) {
            alert('Please provide an API key.');
            return;
        }

        fetch('https://aihorde.net/api/v2/find_user', {
            headers: {
                'apikey': apiKey,
                'Client-Agent': 'aihorde-user-panel:0.1'
            }
        })
            .then(function (res) {
                if (!res.ok) throw new Error('API request failed');
                return res.json();
            })
            .then(function (data) {
                document.getElementById('username').textContent = data.username || '';
                if (data.kudos_details) {
                    document.getElementById('kudos-accumulated').textContent = data.kudos_details.accumulated;
                    document.getElementById('kudos-gifted').textContent = data.kudos_details.gifted;
                    document.getElementById('kudos-received').textContent = data.kudos_details.received;
                }
                infoDiv.classList.remove('d-none');
            })
            .catch(function (err) {
                infoDiv.classList.add('d-none');
                alert('Failed to load user info');
                console.error(err);
            });
    });
});
