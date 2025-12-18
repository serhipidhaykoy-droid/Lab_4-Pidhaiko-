let doctorsData = [];
let servicesData = [];

// 1. ЗАВАНТАЖЕННЯ ДАНИХ (Doctors + Services)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [docsRes, servRes] = await Promise.all([
            fetch('doctors.json'),
            fetch('services.json')
        ]);

        doctorsData = await docsRes.json();
        servicesData = await servRes.json();

        initApp();
    } catch (error) {
        console.error("Помилка завантаження:", error);
        alert("Запустіть через Live Server!");
    }
});

function initApp() {
    renderDoctors(doctorsData);
    renderCalculator();
    populateSelects();
}

// 2. КАТАЛОГ І ФІЛЬТРАЦІЯ
function renderDoctors(doctors) {
    const container = document.getElementById('doctors-container');
    container.innerHTML = '';
    
    doctors.forEach(doc => {
        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="doctor-card p-4 rounded text-center h-100 shadow-sm border">
                    <img src="${doc.photo}" class="rounded-circle mb-3" width="120" height="120">
                    <h5 class="fw-bold">${doc.name}</h5>
                    <p class="text-primary fw-bold small text-uppercase">${doc.specialty}</p>
                    <button class="btn btn-outline-primary rounded-pill px-4" onclick="openModal(${doc.id})">Детальніше</button>
                </div>
            </div>`;
    });
}

function filterDoctors(type, btn) {
    document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filtered = type === 'all' ? doctorsData : doctorsData.filter(d => d.type === type);
    renderDoctors(filtered);
}

// 3. МОДАЛЬНЕ ВІКНО
function openModal(id) {
    const doc = doctorsData.find(d => d.id === id);
    document.getElementById('modalName').textContent = doc.name;
    document.getElementById('modalEdu').textContent = doc.education;
    document.getElementById('modalLang').textContent = doc.languages.join(', ');
    document.getElementById('modalExp').textContent = doc.experience;
    document.getElementById('modalDesc').textContent = doc.description;
    document.getElementById('modalImg').src = doc.photo;
    new bootstrap.Modal(document.getElementById('doctorModal')).show();
}

// 4. КАЛЬКУЛЯТОР ТА ДРУК
function renderCalculator() {
    const container = document.getElementById('services-checkboxes');
    servicesData.forEach(s => {
        container.innerHTML += `
            <div class="form-check mb-2">
                <input class="form-check-input calc-check" type="checkbox" value="${s.price}" id="serv${s.id}">
                <label class="form-check-label" for="serv${s.id}">${s.name} (${s.price} грн)</label>
            </div>`;
    });

    document.querySelectorAll('.calc-check').forEach(chk => {
        chk.addEventListener('change', () => {
            let total = 0;
            document.querySelectorAll('.calc-check:checked').forEach(c => total += parseInt(c.value));
            document.getElementById('total-price').textContent = total;
        });
    });
}

function printCheck() {
    window.print();
}

// 5. СИСТЕМА ЗАПИСУ (Selects + Calendar Logic)
function populateSelects() {
    const docSelect = document.getElementById('doctor-select');
    const servSelect = document.getElementById('service-select');

    doctorsData.forEach(d => docSelect.innerHTML += `<option value="${d.id}">${d.name} (${d.specialty})</option>`);
    servicesData.forEach(s => servSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
}

// Скидання календаря при зміні лікаря
function resetSchedule() {
    const dateInput = document.getElementById('date-picker');
    const timeSelect = document.getElementById('time-select');
    
    dateInput.disabled = false;
    dateInput.value = '';
    timeSelect.innerHTML = '<option value="">Оберіть час...</option>';
    timeSelect.disabled = true;
}

// Логіка розкладу: Дата -> День тижня -> Список годин
function loadTimeSlots() {
    const docId = parseInt(document.getElementById('doctor-select').value);
    const dateValue = document.getElementById('date-picker').value;
    const timeSelect = document.getElementById('time-select');
    
    if (!docId || !dateValue) return;

    const doctor = doctorsData.find(d => d.id === docId);
    const date = new Date(dateValue);
    
    // Отримуємо день тижня (0 - неділя, 1 - понеділок...)
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = daysMap[date.getDay()];

    const slots = doctor.schedule[dayName]; // Шукаємо в JSON

    timeSelect.innerHTML = '<option value="">Оберіть час...</option>';
    
    if (slots && slots.length > 0) {
        timeSelect.disabled = false;
        slots.forEach(time => {
            timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
        });
    } else {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option>Немає вільних місць</option>';
    }
}

// 6. ВАЛІДАЦІЯ ФОРМИ
document.getElementById('appointment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let isValid = true;

    // ПІБ
    const name = document.getElementById('name');
    if (name.value.length < 3) {
        name.classList.add('is-invalid'); isValid = false;
    } else name.classList.remove('is-invalid');

    // Телефон (+380...)
    const phone = document.getElementById('phone');
    const phoneRegex = /^\+380\d{9}$/;
    if (!phoneRegex.test(phone.value)) {
        phone.classList.add('is-invalid'); isValid = false;
    } else phone.classList.remove('is-invalid');

    // Поля select
    if(!document.getElementById('service-select').value) isValid = false;
    if(!document.getElementById('time-select').value) isValid = false;

    if (isValid) {
        alert("Запис успішно створено!");
        this.reset();
        document.getElementById('total-price').textContent = 0;
    }
});

// 7. ЧАТ-БОТ
function toggleChat() {
    const w = document.getElementById('chat-widget');
    w.style.display = w.style.display === 'none' ? 'block' : 'none';
}

function chatDiagnose(problem) {
    let specType = '';
    let text = '';

    switch(problem) {
        case 'heart': specType = 'cardiology'; text = 'Вам потрібен Кардіолог.'; break;
        case 'stomach': specType = 'therapy'; text = 'Раджу звернутися до Терапевта.'; break;
        case 'child': specType = 'pediatrics'; text = 'Запишіться до Педіатра.'; break;
        case 'checkup': specType = 'therapy'; text = 'Почніть з огляду у Терапевта.'; break;
    }

    // Знаходимо лікаря
    const doctor = doctorsData.find(d => d.type === specType);
    
    const chatBody = document.getElementById('chat-body');
    chatBody.innerHTML += `<div class="bot-msg text-white bg-primary mt-2">${text} <br> Рекомендую: ${doctor.name}</div>`;
    
    // Пропозиція записатися
    chatBody.innerHTML += `
        <div class="mt-2">
            <a href="#appointment" class="btn btn-sm btn-success w-100" onclick="toggleChat()">Записатися зараз</a>
        </div>`;
    
    chatBody.scrollTop = chatBody.scrollHeight;
}