document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('apikey');
    const button = document.getElementById('load-info');
    const infoDiv = document.getElementById('user-info');
    const sharedKeysDiv = document.getElementById('shared-keys');
    const sharedKeysList = document.getElementById('shared-keys-list');
    const createKeyBtn = document.getElementById('create-shared-key');
    const modalElem = document.getElementById('sharedKeyModal');
    const modalName = document.getElementById('modal-name');
    const modalKudos = document.getElementById('modal-kudos');
    const modalExpiry = document.getElementById('modal-expiry');
    const saveKeyBtn = document.getElementById('save-key');
    const sharedKeyModal = new bootstrap.Modal(modalElem);
    let editingKeyId = null;
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

    function apiFetch(url, options) {
        return fetch(url, options).then(function(res) {
            return res.json().catch(function() { return {}; }).then(function(body) {
                if (!res.ok) {
                    throw new Error(body.message || 'API request failed');
                }
                return body;
            });
        });
    }

    function loadSharedKeys(apiKey, ids) {
        sharedKeysList.innerHTML = '';
        if (!ids || ids.length === 0) {
            sharedKeysList.innerHTML = '<tr><td colspan="6" class="text-center">No Shared Keys</td></tr>';
            sharedKeysDiv.classList.remove('d-none');
            return;
        }
        ids.forEach(function(id) {
            apiFetch('https://aihorde.net/api/v2/sharedkeys/' + id, {
                headers: {
                    'Client-Agent': 'aihorde-user-panel:0.1',
                    'apikey': apiKey
                }
            })
            .then(function(key) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td>' + key.id + '</td>' +
                    '<td>' + (key.name || '') + '</td>' +
                    '<td>' + key.kudos + '</td>' +
                    '<td>' + (key.expiry || '') + '</td>' +
                    '<td>' + key.utilized + '</td>' +
                    '<td>' +
                        '<button class="btn btn-sm btn-secondary me-1 edit-key" data-id="' + key.id + '">Edit</button>' +
                        '<button class="btn btn-sm btn-danger delete-key" data-id="' + key.id + '">Delete</button>' +
                    '</td>';
                sharedKeysList.appendChild(tr);
            })
            .catch(function(err) {
                console.error(err);
            });
        });
        sharedKeysDiv.classList.remove('d-none');
    }

    createKeyBtn.addEventListener('click', function() {
        editingKeyId = null;
        document.getElementById('sharedKeyModalLabel').textContent = 'Create Shared Key';
        modalName.value = '';
        modalKudos.value = '';
        modalExpiry.value = '';
        sharedKeyModal.show();
    });

    sharedKeysList.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-key')) {
            var id = e.target.getAttribute('data-id');
            apiFetch('https://aihorde.net/api/v2/sharedkeys/' + id, {
                headers: {
                    'Client-Agent': 'aihorde-user-panel:0.1',
                    'apikey': input.value.trim()
                }
            })
            .then(function(key) {
                editingKeyId = id;
                document.getElementById('sharedKeyModalLabel').textContent = 'Edit Shared Key';
                modalName.value = key.name || '';
                modalKudos.value = key.kudos;
                modalExpiry.value = '';
                sharedKeyModal.show();
            })
            .catch(function(err) {
                alert(err.message);
            });
        } else if (e.target.classList.contains('delete-key')) {
            var idDel = e.target.getAttribute('data-id');
            if (confirm('Delete this shared key?')) {
                apiFetch('https://aihorde.net/api/v2/sharedkeys/' + idDel, {
                    method: 'DELETE',
                    headers: {
                        'apikey': input.value.trim(),
                        'Client-Agent': 'aihorde-user-panel:0.1'
                    }
                })
                .then(function() {
                    e.target.closest('tr').remove();
                })
                .catch(function(err) {
                    alert(err.message);
                });
            }
        }
    });

    saveKeyBtn.addEventListener('click', function() {
        var payload = {
            name: modalName.value,
            kudos: parseInt(modalKudos.value, 10) || -1,
            expiry: parseInt(modalExpiry.value, 10) || -1
        };
        var headers = {
            'apikey': input.value.trim(),
            'Client-Agent': 'aihorde-user-panel:0.1',
            'Content-Type': 'application/json'
        };
        var url, method;
        if (editingKeyId) {
            url = 'https://aihorde.net/api/v2/sharedkeys/' + editingKeyId;
            method = 'PATCH';
        } else {
            url = 'https://aihorde.net/api/v2/sharedkeys';
            method = 'PUT';
        }
        apiFetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then(function() {
            sharedKeyModal.hide();
            button.click();
        })
        .catch(function(err) {
            alert(err.message);
        });
    });

    button.addEventListener('click', function () {
        const apiKey = input.value.trim();
        if (!apiKey) {
            alert('Please provide an API key.');
            return;
        }

        apiFetch('https://aihorde.net/api/v2/find_user', {
            headers: {
                'apikey': apiKey,
                'Client-Agent': 'aihorde-user-panel:0.1'
            }
        })
            .then(function (data) {
                document.getElementById('username').textContent = data.username || '';
                document.getElementById('kudos-total').textContent = data.kudos != null ? data.kudos : '';
                if (data.kudos_details) {
                    document.getElementById('kudos-accumulated').textContent = data.kudos_details.accumulated;
                    document.getElementById('kudos-gifted').textContent = data.kudos_details.gifted;
                    document.getElementById('kudos-received').textContent = data.kudos_details.received;
                }
                infoDiv.classList.remove('d-none');
                loadSharedKeys(apiKey, data.sharedkey_ids);
            })
            .catch(function (err) {
                infoDiv.classList.add('d-none');
                alert(err.message);
            });
    });
});
