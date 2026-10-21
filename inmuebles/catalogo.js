const API_URL =
    "./catalogo.json";

const productosContenedor =
    document.getElementById("productos");

const categoriasContenedor =
    document.getElementById("categorias-select");

const localidadesContenedor =
    document.getElementById("localidades-select");

const buscador =
    document.getElementById("buscador");

const ordenar =
    document.getElementById("ordenar");

const sinResultados =
    document.getElementById("sinResultados");

const contador =
    document.getElementById("contador");

const paginacion =
    document.getElementById("paginacion");

let productos = [];

let categoriaActual = "Todas";

let localidadActual = "Todas";

let ordenActual = "orden";

let numeroWhatsapp = "";

let mensajeWhatsapp = "";

let paginaActual = 1;

let productosPorPagina = window.innerWidth <= 700 ? 6 : 12;

// Detectar cambios de tamaño de ventana para ajustar productos por página
window.addEventListener('resize', () => {
    const nuevosProductosPorPagina = window.innerWidth <= 700 ? 6 : 12;
    if (nuevosProductosPorPagina !== productosPorPagina) {
        productosPorPagina = nuevosProductosPorPagina;
        paginaActual = 1; // Reiniciar a la primera página
        mostrarProductos();
    }
});


// ============================
// CARGAR DATOS
// ============================

async function cargarProductos() {

    try {

        productosContenedor.innerHTML = `
            <div class="loader">
                <div class="loader-spinner"></div>
                <div class="loader-text">Cargando propiedades...</div>
            </div>
        `;

        const respuesta =
            await fetch(API_URL);

        if (!respuesta.ok) {

            throw new Error(
                "No se pudo conectar con la API"
            );

        }

        const datos =
            await respuesta.json();

        numeroWhatsapp =
            datos.whatsapp || "";

        mensajeWhatsapp =
            datos.mensajeWhatsapp || "";

        productos =
            (datos.propiedades || [])
                .filter(
                    producto =>
                        esVisible(producto)
                );

        crearCategorias();

        crearLocalidades();

        mostrarProductos();

    } catch (error) {

        console.error(error);

        productosContenedor.innerHTML = `
            <p>
                No se pudieron cargar las propiedades.
            </p>
        `;

        actualizarAlturaIframe();

    }

}


// ============================
// REGLAS DE CAMPOS
// ============================

function esVisible(producto) {

    return (
        normalizar(
            producto.visible
        ) !== "no"
    );

}


function esDestacado(producto) {

    return (
        normalizar(
            producto.destacado
        ) === "si"
    );

}


function tieneStock(producto) {

    return (
        normalizar(
            producto.stock
        ) !== "no"
    );

}


function normalizar(valor) {

    return String(
        valor ?? ""
    )
        .trim()
        .toLowerCase();

}


function obtenerDescripcionCorta(detalles) {
    const desc = String(detalles || "").trim();
    const maxLength = 60; // Máximo de caracteres para la descripción corta

    if (desc.length <= maxLength) {
        return escaparHTML(desc);
    }

    return escaparHTML(desc.substring(0, maxLength)) + "...";
}


// ============================
// CATEGORIAS
// ============================

function crearCategorias() {

    const categorias =
        [
            ...new Set(
                productos
                    .map(
                        producto =>
                            producto.categoria
                    )
                    .filter(Boolean)
            )
        ]
        .sort();

    categoriasContenedor.innerHTML =
        '<option value="Todas">Categorías</option>';

    categorias.forEach(
        categoria => {

            crearOpcionCategoria(
                categoria
            );

        }
    );

}


function crearLocalidades() {

    const localidades =
        [
            ...new Set(
                productos
                    .map(
                        producto =>
                            producto.localidad
                    )
                    .filter(Boolean)
            )
        ]
        .sort();

    localidadesContenedor.innerHTML =
        '<option value="Todas">Localidades</option>';

    localidades.forEach(
        localidad => {

            crearOpcionLocalidad(
                localidad
            );

        }
    );

}


function crearOpcionCategoria(
    categoria
) {

    const opcion =
        document.createElement(
            "option"
        );

    opcion.value =
        categoria;

    opcion.textContent =
        categoria;

    if (
        categoria ===
        categoriaActual
    ) {

        opcion.selected =
            true;

    }

    categoriasContenedor
        .appendChild(
            opcion
        );

}


function crearOpcionLocalidad(
    localidad
) {

    const opcion =
        document.createElement(
            "option"
        );

    opcion.value =
        localidad;

    opcion.textContent =
        localidad;

    if (
        localidad ===
        localidadActual
    ) {

        opcion.selected =
            true;

    }

    localidadesContenedor
        .appendChild(
            opcion
        );

}

// Event listener para el select de categorías
categoriasContenedor.addEventListener(
    "change",
    () => {

        categoriaActual =
            categoriasContenedor.value;

        paginaActual =
            1;

        mostrarProductos();

    }
);


// Event listener para el select de localidades
localidadesContenedor.addEventListener(
    "change",
    () => {

        localidadActual =
            localidadesContenedor.value;

        paginaActual =
            1;

        mostrarProductos();

    }
);


// ============================
// MOSTRAR PRODUCTOS
// ============================

function mostrarProductos() {

    const texto =
        buscador.value
            .trim()
            .toLowerCase();


    let filtrados =
        productos.filter(
            producto => {

                const coincideCategoria =
                    categoriaActual ===
                        "Todas" ||
                    producto.categoria ===
                        categoriaActual;


                const coincideLocalidad =
                    localidadActual ===
                        "Todas" ||
                    producto.localidad ===
                        localidadActual;


                const tipo =
                    String(
                        producto.tipo || ""
                    )
                        .toLowerCase();


                const localidad =
                    String(
                        producto.localidad || ""
                    )
                        .toLowerCase();


                const direccion =
                    String(
                        producto.direccion || ""
                    )
                        .toLowerCase();


                const descripcion =
                    String(
                        producto.detalles || ""
                    )
                        .toLowerCase();


                return (
                    coincideCategoria &&
                    coincideLocalidad &&
                    (
                        tipo.includes(texto) ||
                        localidad.includes(texto) ||
                        direccion.includes(texto) ||
                        descripcion.includes(texto)
                    )
                );

            }
        );


    ordenarProductos(
        filtrados
    );


    // ============================
    // PAGINACION
    // ============================

    const totalProductos =
        filtrados.length;

    const totalPaginas =
        Math.ceil(
            totalProductos /
            productosPorPagina
        );


    if (
        paginaActual >
        totalPaginas &&
        totalPaginas > 0
    ) {

        paginaActual =
            totalPaginas;

    }


    if (
        totalPaginas === 0
    ) {

        paginaActual =
            1;

    }


    const inicio =
        (
            paginaActual - 1
        ) *
        productosPorPagina;


    const fin =
        inicio +
        productosPorPagina;


    const productosPagina =
        filtrados.slice(
            inicio,
            fin
        );


    // ============================
    // CONTADOR
    // ============================

    contador.textContent =
        totalProductos === 1
            ? "1 propiedad"
            : `${totalProductos} propiedades`;


    // ============================
    // SIN RESULTADOS
    // ============================

    sinResultados.classList.toggle(
        "oculto",
        totalProductos > 0
    );


    // ============================
    // PRODUCTOS
    // ============================

    productosContenedor.innerHTML =
        "";


    productosPagina.forEach(
        producto => {

            productosContenedor
                .appendChild(
                    crearProducto(
                        producto
                    )
                );

        }
    );


    // ============================
    // PAGINACION
    // ============================

    crearPaginacion(
        totalPaginas
    );


    // ============================
    // ACTUALIZAR ALTURA DEL IFRAME
    // ============================

    actualizarAlturaIframe();

}


// ============================
// PAGINACION
// ============================

function crearPaginacion(
    totalPaginas
) {

    paginacion.innerHTML =
        "";


    if (
        totalPaginas <= 1
    ) {

        return;

    }


    const anterior =
        document.createElement(
            "button"
        );

    anterior.type =
        "button";

    anterior.className =
        "pagina-btn pagina-anterior";

    anterior.textContent =
        "‹ Anterior";

    anterior.disabled =
        paginaActual === 1;

    anterior.addEventListener(
        "click",
        () => {

            if (
                paginaActual > 1
            ) {

                paginaActual--;

                mostrarProductos();

                desplazarseAlCatalogo();

            }

        }
    );


    paginacion.appendChild(
        anterior
    );


    // ============================
    // NUMEROS
    // ============================

    const paginas =
        obtenerNumerosPaginas(
            totalPaginas
        );


    paginas.forEach(
        numero => {

            if (
                numero === "..."
            ) {

                const separador =
                    document.createElement(
                        "span"
                    );

                separador.className =
                    "pagina-separador";

                separador.textContent =
                    "...";

                paginacion.appendChild(
                    separador
                );

                return;

            }


            const boton =
                document.createElement(
                    "button"
                );

            boton.type =
                "button";

            boton.className =
                "pagina-btn";


            if (
                numero ===
                paginaActual
            ) {

                boton.classList.add(
                    "activa"
                );

                boton.setAttribute(
                    "aria-current",
                    "page"
                );

            }


            boton.textContent =
                numero;


            boton.addEventListener(
                "click",
                () => {

                    paginaActual =
                        numero;

                    mostrarProductos();

                    desplazarseAlCatalogo();

                }
            );


            paginacion.appendChild(
                boton
            );

        }
    );


    const siguiente =
        document.createElement(
            "button"
        );

    siguiente.type =
        "button";

    siguiente.className =
        "pagina-btn pagina-siguiente";

    siguiente.textContent =
        "Siguiente ›";

    siguiente.disabled =
        paginaActual ===
        totalPaginas;

    siguiente.addEventListener(
        "click",
        () => {

            if (
                paginaActual <
                totalPaginas
            ) {

                paginaActual++;

                mostrarProductos();

                desplazarseAlCatalogo();

            }

        }
    );


    paginacion.appendChild(
        siguiente
    );

}


// ============================
// NUMEROS DE PAGINAS
// ============================

function obtenerNumerosPaginas(
    totalPaginas
) {

    if (
        totalPaginas <= 7
    ) {

        return Array.from(
            {
                length:
                    totalPaginas
            },
            (
                _,
                i
            ) =>
                i + 1
        );

    }


    const paginas =
        [];


    paginas.push(
        1
    );


    if (
        paginaActual > 4
    ) {

        paginas.push(
            "..."
        );

    }


    const inicio =
        Math.max(
            2,
            paginaActual - 1
        );


    const fin =
        Math.min(
            totalPaginas - 1,
            paginaActual + 1
        );


    for (
        let i = inicio;
        i <= fin;
        i++
    ) {

        paginas.push(
            i
        );

    }


    if (
        paginaActual <
        totalPaginas - 3
    ) {

        paginas.push(
            "..."
        );

    }


    paginas.push(
        totalPaginas
    );


    return [
        ...new Set(
            paginas
        )
    ];

}


// ============================
// SCROLL AL CATALOGO
// ============================

function desplazarseAlCatalogo() {

    const catalogo =
        document.getElementById(
            "catalogo-app"
        );


    if (!catalogo) {

        return;

    }


    const posicion =
        catalogo.getBoundingClientRect().top +
        window.scrollY -
        20;


    window.scrollTo(
        {
            top: posicion,
            behavior: "smooth"
        }
    );

}


// ============================
// ORDENAMIENTO
// ============================

function ordenarProductos(
    lista
) {

    if (
        ordenActual ===
        "precio-asc"
    ) {

        lista.sort(
            (a, b) =>
                obtenerPrecio(
                    a.precio
                ) -
                obtenerPrecio(
                    b.precio
                )
        );

        return;

    }


    if (
        ordenActual ===
        "precio-desc"
    ) {

        lista.sort(
            (a, b) =>
                obtenerPrecio(
                    b.precio
                ) -
                obtenerPrecio(
                    a.precio
                )
        );

        return;

    }


    lista.sort(
        (a, b) => {

            const ordenA =
                obtenerOrden(
                    a.orden
                );

            const ordenB =
                obtenerOrden(
                    b.orden
                );


            return ordenA - ordenB;

        }
    );

}


function obtenerOrden(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {

        return 999999;

    }


    const numero =
        parseInt(
            String(valor).trim(),
            10
        );


    if (
        Number.isNaN(numero)
    ) {

        return 999999;

    }


    return numero;

}


// ============================
// CONVERTIR PRECIO
// ============================

function obtenerPrecio(
    precio
) {

    let texto =
        String(
            precio ?? ""
        );


    texto =
        texto.replace(
            /[^0-9,.-]/g,
            ""
        );


    if (
        texto.includes(".") &&
        !texto.includes(",")
    ) {

        texto =
            texto.replace(
                /\./g,
                ""
            );

    }


    texto =
        texto.replace(
            ",",
            "."
        );


    const numero =
        parseFloat(
            texto
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : 0;

}


// ============================
// CREAR PRODUCTO
// ============================

function crearProducto(
    producto
) {

    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        "producto";


    const destacado =
        esDestacado(
            producto
        );


    const stock =
        tieneStock(
            producto
        );


    if (destacado) {

        tarjeta.classList.add(
            "destacado"
        );

    }


    if (!stock) {

        tarjeta.classList.add(
            "sin-stock"
        );

    }


    // ============================
    // IMAGEN
    // ============================

    const imagenContenedor =
        document.createElement(
            "div"
        );


    imagenContenedor.className =
        "producto-imagen-contenedor";


    const imagen =
        document.createElement(
            "img"
        );


    imagen.className =
        "producto-imagen";


    imagen.alt =
        producto.tipo + " en " + producto.localidad;


    imagen.loading =
        "lazy";


    if (producto.foto) {

        imagen.src =
            obtenerUrlImagen(
                producto.foto
            );

    }


    imagen.onload =
        actualizarAlturaIframe;


    imagen.onerror =
        () => {

            imagen.style.display =
                "none";

            actualizarAlturaIframe();

        };


    imagenContenedor
        .appendChild(
            imagen
        );


    // ============================
    // INFORMACION
    // ============================

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "producto-info";


    if (destacado) {

        const etiqueta =
            document.createElement(
                "span"
            );


        etiqueta.className =
            "etiqueta-destacado";


        etiqueta.textContent =
            "DESTACADO";


        tarjeta.appendChild(
            etiqueta
        );

    }


    const categoria =
        producto.categoria
            ? `
                <div class="producto-categoria">
                    ${escaparHTML(
                        producto.categoria
                    )}
                </div>
            `
            : "";


    const descuento =
        producto.descuento
            ? `
                <div class="producto-descuento">
                    ${escaparHTML(
                        producto.descuento
                    )}
                </div>
            `
            : "";


    const estadoStock =
        stock
            ? ""
            : `
                <div class="sin-stock-text">
                    NO DISPONIBLE
                </div>
            `;


    // Información específica de propiedades
    const infoPropiedad = `
        <div class="producto-info-propiedad">
            ${producto.localidad ? `<span class="propiedad-localidad">${escaparHTML(producto.localidad)}</span>` : ''}
            ${producto.tamanio ? `<span class="propiedad-tamanio">${escaparHTML(producto.tamanio)} m²</span>` : ''}
        </div>
    `;


    info.innerHTML = `

        ${categoria}

        <h2>
            ${escaparHTML(
                producto.tipo
            )}
        </h2>

        ${infoPropiedad}

        ${
            producto.direccion
                ? `
                    <div class="producto-direccion">
                        ${escaparHTML(producto.direccion)}
                    </div>
                `
                : ""
        }

        ${
            producto.detalles
                ? `
                    <div class="producto-descripcion">
                        ${obtenerDescripcionCorta(producto.detalles)}
                    </div>
                `
                : ""
        }

        <div class="producto-precio">
            ${escaparHTML(
                producto.precio
            )}
        </div>

        ${descuento}

        ${estadoStock}

        <a
            class="producto-boton"
            href="#"
        >
            Consultar
        </a>

    `;


    // ============================
    // WHATSAPP
    // ============================

    const boton =
        info.querySelector(
            ".producto-boton"
        );


    boton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            abrirWhatsApp(
                producto
            );

        }
    );


    tarjeta.appendChild(
        imagenContenedor
    );

    // Agregar evento de clic a toda la tarjeta para abrir el modal
    tarjeta.addEventListener('click', (event) => {
        // Evitar que se abra si se hace clic en el botón de WhatsApp
        if (event.target.closest('.producto-boton')) {
            return;
        }
        abrirModalProducto(producto);
    });


    tarjeta.appendChild(
        info
    );


    return tarjeta;

}


// ============================
// IMAGEN
// ============================

function obtenerUrlImagen(
    foto
) {

    const texto =
        String(
            foto
        );


    const markdown =
        texto.match(
            /\((https?:\/\/[^)]+)\)/
        );


    if (markdown) {

        return markdown[1];

    }


    const inicio =
        texto.indexOf(
            "https://"
        );


    if (inicio >= 0) {

        return texto.substring(
            inicio
        );

    }


    return texto;

}


// ============================
// WHATSAPP
// ============================

function abrirWhatsApp(
    producto
) {

    if (!numeroWhatsapp) {

        alert(
            "No hay un número de WhatsApp configurado."
        );

        return;

    }


    let mensaje =
        mensajeWhatsapp;


    if (mensaje) {

        mensaje += " ";

    }


    mensaje +=
        producto.tipo;


    mensaje +=
        " - " +
        producto.precio;


    // Agregar información de la propiedad si está disponible
    if (producto.localidad) {
        mensaje += " - Ubicación: " + producto.localidad;
    }

    if (producto.direccion) {
        mensaje += " - Dirección: " + producto.direccion;
    }

    if (producto.tamanio) {
        mensaje += " - Tamaño: " + producto.tamanio + " m²";
    }


    const numero =
        String(
            numeroWhatsapp
        )
        .replace(
            /\D/g,
            ""
        );


    const url =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(
            mensaje
        );


    window.open(
        url,
        "_blank"
    );

}


// ============================
// SEGURIDAD
// ============================

function escaparHTML(
    texto
) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================
// EVENTOS
// ============================

buscador.addEventListener(
    "input",
    () => {

        paginaActual =
            1;

        mostrarProductos();

    }
);


ordenar.addEventListener(
    "change",
    () => {

        ordenActual =
            ordenar.value;

        paginaActual =
            1;

        mostrarProductos();

    }
);


// ============================
// IFRAME
// ============================

function obtenerAlturaCatalogo() {

    const body =
        document.body;

    const html =
        document.documentElement;


    const altura = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
    );

    // Añadir un pequeño margen para evitar scroll
    return altura + 20;

}


function actualizarAlturaIframe() {

    const altura =
        obtenerAlturaCatalogo();


    window.parent.postMessage(
        {
            tipo:
                "catalogo-altura",

            altura:
                altura
        },
        "*"
    );

}


// ============================
// OBSERVAR CAMBIOS DE ALTURA
// ============================

if (
    typeof ResizeObserver !==
    "undefined"
) {

    const observador =
        new ResizeObserver(
            () => {

                actualizarAlturaIframe();

            }
        );


    observador.observe(
        document.documentElement
    );

}


// ============================
// MODAL DE PRODUCTO
// ============================

const modal = document.getElementById('producto-modal');
const modalClose = document.querySelector('.modal-close');
const modalImg = document.getElementById('modal-img');
const modalCategoria = document.getElementById('modal-categoria');
const modalNombre = document.getElementById('modal-nombre');
const modalDescripcion = document.getElementById('modal-descripcion');
const modalPrecio = document.getElementById('modal-precio');
const modalStock = document.getElementById('modal-stock');
const modalWhatsapp = document.getElementById('modal-whatsapp');

let productoActualModal = null;

function abrirModalProducto(producto) {
    productoActualModal = producto;

    // Enviar mensaje a la página principal para abrir el modal
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'abrirModalProducto',
                producto: {
                    ...producto,
                    whatsappNumero: numeroWhatsapp,
                    whatsappMensaje: mensajeWhatsapp
                }
            }, '*');
            return;
        }
    } catch (e) {
        console.log('No se puede comunicar con la página principal');
    }

    // Fallback: mostrar modal dentro del iframe si no hay comunicación
    // Llenar datos del modal
    if (producto.foto) {
        modalImg.src = obtenerUrlImagen(producto.foto);
        modalImg.style.display = 'block';
    } else {
        modalImg.style.display = 'none';
    }

    modalCategoria.textContent = producto.categoria || '';
    modalNombre.textContent = producto.tipo || '';

    // Crear HTML para descripción con información de la propiedad
    let modalDetalleHTML = '';
    if (producto.detalles) {
        modalDetalleHTML += `<p>${escaparHTML(producto.detalles)}</p>`;
    }

    // Agregar información específica de la propiedad
    if (producto.localidad || producto.direccion || producto.tamanio) {
        modalDetalleHTML += '<div class="modal-info-propiedad">';
        if (producto.localidad) {
            modalDetalleHTML += `<span class="modal-propiedad-localidad">Ubicación: ${escaparHTML(producto.localidad)}</span>`;
        }
        if (producto.direccion) {
            modalDetalleHTML += `<span class="modal-propiedad-direccion">Dirección: ${escaparHTML(producto.direccion)}</span>`;
        }
        if (producto.tamanio) {
            modalDetalleHTML += `<span class="modal-propiedad-tamanio">Tamaño: ${escaparHTML(producto.tamanio)} m²</span>`;
        }
        modalDetalleHTML += '</div>';
    }

    modalDescripcion.innerHTML = modalDetalleHTML;
    modalPrecio.textContent = producto.precio || '';

    const stock = tieneStock(producto);
    modalStock.textContent = stock ? 'En stock' : 'Sin stock';
    modalStock.className = stock ? 'modal-stock' : 'modal-stock sin-stock';

    // Guardar datos de WhatsApp en el producto actual para el fallback
    productoActualModal = {
        ...producto,
        whatsappNumero: numeroWhatsapp,
        whatsappMensaje: mensajeWhatsapp
    };

    // Mostrar modal dentro del iframe
    modal.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
}

function cerrarModalProducto() {
    modal.classList.add('oculto');
    document.body.style.overflow = ''; // Restaurar scroll en el iframe
    productoActualModal = null;
    
    // Restaurar scroll en la página principal
    try {
        if (window.parent && window.parent !== window) {
            window.parent.document.body.style.overflow = '';
        }
    } catch (e) {
        // No se puede acceder al padre
        console.log('No se puede acceder a la página principal');
    }
}

// Evento para cerrar modal con el botón X
modalClose.addEventListener('click', cerrarModalProducto);

// Evento para cerrar modal al hacer clic fuera del contenido
modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        cerrarModalProducto();
    }
});

// Evento para cerrar con tecla Escape
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('oculto')) {
        cerrarModalProducto();
    }
});

// Evento para el botón de WhatsApp del modal
modalWhatsapp.addEventListener('click', () => {
    if (productoActualModal) {
        // Usar función directa de WhatsApp con datos del producto
        const numero = productoActualModal.whatsappNumero || numeroWhatsapp;
        const mensajeBase = productoActualModal.whatsappMensaje || mensajeWhatsapp || 'Hola, estoy interesado en:';
        const mensajeProducto = productoActualModal.tipo || '';
        const mensajeLocalidad = productoActualModal.localidad ? ` - ${productoActualModal.localidad}` : '';
        const mensajeDireccion = productoActualModal.direccion ? ` - ${productoActualModal.direccion}` : '';
        const mensajeTamanio = productoActualModal.tamanio ? ` - ${productoActualModal.tamanio} m²` : '';
        const mensajePrecio = productoActualModal.precio ? ` - ${productoActualModal.precio}` : '';
        const mensajeCompleto = `${mensajeBase} ${mensajeProducto}${mensajeLocalidad}${mensajeDireccion}${mensajeTamanio}${mensajePrecio}`;

        if (!numero) {
            alert('No hay un número de WhatsApp configurado.');
            return;
        }

        const numeroLimpio = String(numero).replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeCompleto)}`;
        window.open(whatsappUrl, '_blank');
    }
});

// ============================
// INICIO
// ============================

cargarProductos();


window.addEventListener(
    "load",
    () => {

        actualizarAlturaIframe();

    }
);
