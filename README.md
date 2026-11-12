# 🚌 EVATRE - Guía Inteligente de Rutas de Transporte Público `[BETA]`

> **Estado del proyecto:** Versión **Beta**. Por el momento, el sistema opera únicamente con las rutas y el mapa de la ciudad de **Cúcuta**, con arquitectura proyectada para expandirse a otras ciudades en futuras versiones.

Aplicación desarrollada en **Java (NetBeans)** que modela redes de transporte urbano mediante **Teoría de Grafos** para ayudar a cualquier persona a saber qué buseta tomar según su destino y visualizar el recorrido completo de cada línea.

* **Proyecto Académico:** Materia de Matemáticas Discretas  
* **Docente:** Leydi Yaritza Martínez Pardo

##  Propósito del Proyecto
Cuando una persona visita una ciudad nueva o se encuentra en un sector desconocido, suele resultar difícil saber qué ruta de transporte público la lleva a su destino. **EVATRE** resuelve este problema permitiendo consultar las líneas de busetas disponibles hacia una ubicación específica y mostrando visualmente todo el trayecto por el que circula cada ruta.

##  Fundamentación Matemática (Teoría de Grafos)
* **Modelado de la Red Urbana:** Los puntos clave y paraderos de Cúcuta (*Los Patios, Ventura Plaza, UFPS, Centro, Terminal y Atalaya*) se representan como **vértices (nodos)**, mientras que los tramos viales se definen como **aristas**.
* **Matrices de Adyacencia:** Estructuran las conexiones directas entre sectores y validan los recorridos oficiales de cada línea de buseta.
* **Búsqueda y Trazado de Rutas:** Procesamiento de grafos en Java para filtrar qué busetas conectan con el destino seleccionado y reconstruir la secuencia de puntos por donde transita cada vehículo.

##  Funcionalidades Principales
1. **Mapa Visual Interactivo:** Interfaz gráfica que permite explorar la distribución espacial de Cúcuta y ubicar sectores de referencia.
2. **Consulta por Destino:** Selección del punto al que el usuario desea llegar para identificar qué busetas cubren ese sector.
3. **Visualización del Recorrido:** Despliegue de la ruta completa y la secuencia de lugares por los que pasa la buseta seleccionada.

##  Alcance Actual y Escalabilidad
* **Versión actual (Beta):** Soporte exclusivo para sectores y líneas de busetas de **Cúcuta**.
* **Proyección futura:** La estructura modular de grafos y matrices de adyacencia permite integrar mapas, nodos y recorridos de otras ciudades sin alterar el motor lógico de la aplicación.

## Autores
* **Camila Molina Guerrero**
* **Jhoan David Pérez Blanco**
