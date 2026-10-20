document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousedown', () => {
        card.style.transform = 'translateY(-5px) scale(0.98)';});
    card.addEventListener('mouseup', () => {
        card.style.transform = 'translateY(-10px) scale(1)';});});

// Detección de sección activa en el menú
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = sectionId;}});

    navLinks.forEach(link => {link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');}});});

// Variable global para el observador
let observador;

 document.addEventListener("DOMContentLoaded", function() {
            const elementosARevelar = document.querySelectorAll('.reveal');
            observador = new IntersectionObserver((entradas, miObservador) => {
                entradas.forEach(entrada => {if (entrada.isIntersecting) {
                        // Retraso escalonado más rápido para animaciones más fluidas
                        const delay = Array.from(elementosARevelar).indexOf(entrada.target) * 50;
                        setTimeout(() => {
                            entrada.target.classList.add('active');}, delay);
                        miObservador.unobserve(entrada.target);}});},
            { root: null, threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
            elementosARevelar.forEach(el => observador.observe(el));



            // Activar sección inicial al cargar
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('nav a');
            const scrollPosition = window.scrollY + 100;

            let current = '';sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = sectionId;}});

            navLinks.forEach(link => {link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');}});

            // Cargar avisos desde JSON
            cargarAvisos();});

// Función auxiliar para parsear fechas en formato dd/mm/yyyy (argentino)
function parseFechaArgentina(fechaStr) {
    if (!fechaStr) return new Date(0);
    
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return new Date(0);
    
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Los meses en JS son 0-11
    const anio = parseInt(partes[2], 10);
    
    if (isNaN(dia) || isNaN(mes) || isNaN(anio)) return new Date(0);
    
    return new Date(anio, mes, dia);
}

// Función para abrir modal con detalles del servicio
function toggleCard(button) {
    const card = button.closest('.service-card');
    const title = card.querySelector('h3').textContent;
    const fullContent = card.querySelector('.card-full').innerHTML;

    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = title;
    modalBody.innerHTML = fullContent;
    modal.classList.add('active');

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modal
function closeModal() {
    const modal = document.getElementById('service-modal');
    modal.classList.remove('active');

    // Restaurar scroll del body
    document.body.style.overflow = '';
}

// Cerrar modal al hacer clic fuera del contenido
document.getElementById('service-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Función para cargar y mostrar avisos desde avisos.json
async function cargarAvisos() {
    const avisosContainer = document.getElementById('avisos-container');
    
    try {
        const response = await fetch('./avisos.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de avisos');
        }
        
        const avisos = await response.json();
        
        if (avisos.length === 0) {
            avisosContainer.innerHTML = '<p class="avisos-placeholder">No hay avisos disponibles</p>';
            return;
        }
        
        // Ordenar avisos por fecha (más recientes primero)
        const avisosOrdenados = avisos.sort((a, b) => parseFechaArgentina(b.fecha) - parseFechaArgentina(a.fecha));
        
        // Generar HTML para cada aviso
        const avisosHTML = avisosOrdenados.map(aviso => {
            const fecha = parseFechaArgentina(aviso.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const adjuntoHTML = aviso.adjunto ? 
                `<a href="${aviso.adjunto}" target="_blank" rel="noopener noreferrer" class="btn-adjunto">📎 Ver adjunto</a>` : '';
            
            return `
                <div class="aviso-card reveal">
                    <div class="aviso-header">
                        <h3 class="aviso-titulo">${aviso.titulo}</h3>
                    </div>
                    <div class="aviso-fecha">${fechaFormateada}</div>
                    <div class="aviso-autor">Por: ${aviso.autor}</div>
                    <p class="aviso-texto">${aviso.texto}</p>
                    ${adjuntoHTML}
                </div>
            `;
        }).join('');
        
        avisosContainer.innerHTML = avisosHTML;
        
        // Re-inicializar el observador para los nuevos elementos
        const nuevosReveal = document.querySelectorAll('.aviso-card.reveal');
        nuevosReveal.forEach(el => observador.observe(el));
        
    } catch (error) {
        console.error('Error al cargar avisos:', error);
        avisosContainer.innerHTML = '<p class="avisos-placeholder">Error al cargar los avisos. Por favor, inténtelo más tarde.</p>';
    }
}

