

console.log('✅ modal.js loaded');


function setModalDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('applicationDate');
    if (dateInput) {
        dateInput.value = today;
    }
}


window.showAddForm = function () {
    console.log('📖 Opening Add Application Modal (from modal.js)');

    const modal = document.getElementById('applicationModal');
    const form = document.getElementById('applicationForm');
    const modalTitle = document.getElementById('modalTitle');

    if (!modal) {
        console.error('❌ Modal element #applicationModal not found in DOM');
        alert('Error: Application form not found. Please refresh the page.');
        return;
    }


    if (window.editingId !== undefined) window.editingId = null;

    if (modalTitle) modalTitle.textContent = 'Add New Application';
    if (form) form.reset();

    setModalDefaultDate();


    modal.classList.add('active');
    modal.style.display = 'flex';
}


window.closeModal = function () {
    console.log('Closing Modal');
    const modal = document.getElementById('applicationModal');
    const form = document.getElementById('applicationForm');

    if (modal) {
        modal.classList.remove('active');
        modal.style.display = '';
    }

    if (form) form.reset();
    if (window.editingId !== undefined) window.editingId = null;
}


document.addEventListener('click', function (e) {
    const modal = document.getElementById('applicationModal');
    if (modal && e.target === modal) {
        window.closeModal();
    }
});


document.addEventListener('DOMContentLoaded', function () {
    const addBtns = document.querySelectorAll('.btn-primary');
    addBtns.forEach(btn => {
        if (btn.textContent.includes('Add') || btn.textContent.includes('+')) {
            btn.addEventListener('click', function (e) {

                if (!btn.getAttribute('onclick')) {
                    window.showAddForm();
                }
            });
        }
    });
});
