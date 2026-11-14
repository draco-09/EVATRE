/* =====================================================================
   DATOS DE LA RED (fuente de verdad). Edite aquí para agregar o corregir.

   PARADAS_TXT -> id|Nombre|lat|lng|alias;alias
     Las coordenadas son una estimación inicial: al arrancar, EVATRE las verifica
     con OpenStreetMap; también se pueden corregir desde el mapa (popup de la parada).

   RUTAS_TXT   -> "@Empresa;#color;PREFIJO" abre una empresa; luego una línea por ruta:
     codigo;Nombre de la ruta;paradas separadas por espacio;vías separadas por |
     Un código que empieza con * fue asignado por el equipo (no es oficial).
     Las vías solo se escriben donde hay un documento que las describe.
   ===================================================================== */
const PARADAS_TXT = `
centro|Centro (Parque Santander)|7.8939|-72.5078|centro;parque santander;parque colon
terminal|Terminal de Transportes|7.8845|-72.5015|terminal;terminal de transportes
cenabastos|Cenabastos|7.8800|-72.4860|cenabastos
guaimaral|Guaimaral|7.9170|-72.5090|guaimaral
sevilla|Sevilla|7.8870|-72.5060|sevilla;av sevilla
americas|Av. Las Américas|7.9000|-72.5140|americas;las americas;av las americas
camilodaza|Camilo Daza|7.9215|-72.5130|camilo daza
antoniasantos|Antonia Santos|7.9010|-72.5200|antonia santos
escobal|Escobal|7.9140|-72.5250|escobal
barriobogota|Barrio Bogotá|7.8830|-72.5170|barrio bogota;bogota
santacecilia|Santa Cecilia|7.8890|-72.5230|santa cecilia
bellavista|Bellavista|7.8860|-72.5120|bellavista
nidia|Nidia|7.9060|-72.5400|nidia
desierto|El Desierto|7.9000|-72.5290|el desierto;desierto
atalaya|Ciudad Atalaya|7.9060|-72.5340|atalaya;ciudad atalaya
santaana|Santa Ana|7.9150|-72.5380|santa ana
launion|La Unión|7.9100|-72.5300|la union
pradosnorte|Prados Norte|7.9230|-72.4950|prados norte
hospital|Hospital Erasmo Meoz|7.9029|-72.4940|hospital;erasmo meoz;erasmo
cerropico|Cerro Pico|7.9000|-72.5470|cerro pico;cerropico
elprogreso|El Progreso|7.9010|-72.5500|el progreso
trigal|Trigal del Norte|7.9240|-72.4990|trigal;trigal del norte;trigal norte
belen|Belén|7.9150|-72.4800|belen
salado|El Salado|7.9060|-72.4840|salado;el salado;carcel modelo
portico|El Pórtico|7.9110|-72.4950|portico;el portico
cocacola|Coca Cola|7.9000|-72.5000|coca cola
montebello|Montebello|7.8450|-72.5200|montebello
villasilvania|Villa Silvania|7.8650|-72.5120|villa silvania;silvania
tierralinda|Tierra Linda (Los Patios)|7.8161|-72.5139|tierra linda;tierralinda
llanitos|Llanitos (Los Patios)|7.80221|-72.51790|llanitos;los llanitos
lospatios|Los Patios|7.8342|-72.5059|los patios;patios
laparada|La Parada|7.8300|-72.4480|la parada;parada
villadelrosario|Villa del Rosario|7.8335|-72.4730|villa del rosario;rosario
acacios|Los Acacios|7.8400|-72.4600|acacios;los acacios;acasios
palmita|La Palmita|7.8600|-72.4780|palmita;la palmita
garciaherreros|García Herreros|7.8560|-72.5070|garcia herreros
cuberos|Cuberos|7.8920|-72.5290|cuberos
losalpes|Los Alpes|7.8990|-72.5230|los alpes
vallesrodeo|Valles del Rodeo|7.9080|-72.4700|valles del rodeo;rincon del rodeo
zulima|Zulima|7.9000|-72.4790|zulima
siglo21|Siglo XXI|7.9180|-72.5200|siglo xxi;siglo 21
nogal|El Nogal|7.8700|-72.5200|nogal;el nogal
motilones|Motilones|7.8800|-72.5250|motilones
lasabana|La Sabana|7.8500|-72.5010|la sabana;sabana
sanmartin|San Martín|7.9120|-72.4870|san martin
colsag|Colsag|7.9025|-72.4870|colsag
molinos|Molinos|7.9270|-72.5080|molinos;aeropuerto;camilo daza aeropuerto
colinas|Colinas|7.9230|-72.5170|colinas
nuevohorizonte|Nuevo Horizonte|7.9120|-72.5420|nuevo horizonte
aguascalientes|Aguas Calientes|7.9280|-72.5300|aguas calientes
betania|Betania|7.8420|-72.5260|betania
chaparral|Chaparral|7.9290|-72.5180|chaparral
sena|SENA|7.9100|-72.4930|sena
udes|UDES (Universidad de Santander)|7.9085|-72.5090|udes;universidad de santander
usb|Universidad Simón Bolívar|7.8955|-72.5105|universidad simon bolivar;univ simon bolivar;usb;unisimon;unisimón
escalabrini|Escalabrini|7.9070|-72.5230|escalabrini
gaitan|Gaitán|7.9070|-72.5110|gaitan
sanluis|San Luis|7.9100|-72.5030|san luis
juanarangel|Juana Rangel|7.8800|-72.5290|juana rangel
mariapaz|María Paz|7.8950|-72.5350|maria paz
sancayetano|San Cayetano|7.8700|-72.6100|san cayetano
elzulia|El Zulia|7.9380|-72.5990|el zulia;zulia
pinar|Pinar del Río|7.8690|-72.4990|pinar del rio;pinar
sanrafael|San Rafael|7.8780|-72.5030|san rafael
cormoranes|Torres de Cormoranes|7.9170|-72.4720|cormoranes;cormonares;torres de cormoranes
pradoseste|Prados del Este|7.8960|-72.4720|prados del este
simonbolivar|Simón Bolívar (barrio)|7.9000|-72.5380|simon bolivar;barrio simon bolivar
porvenir|Porvenir|7.9170|-72.5330|porvenir
`;

const RUTAS_TXT = `
@Trasan S.A.;#e53935;TS
TS-04;Llanitos – UDES (pasa por el SENA);llanitos tierralinda lospatios pinar sanrafael terminal sena udes;
1;Tierra Linda – Terminal – Centro – Unisimón;tierralinda lospatios pinar sanrafael terminal centro usb;Av. 10 Los Patios|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal|Av. 8|Calle 9|Calle 13|Av. 6|Calle 15|Av. 2
2;Tierra Linda – Centro – Unisimón – El Progreso (Atalaya);tierralinda lospatios pinar sanrafael terminal centro usb atalaya cerropico elprogreso;Av. 10 Los Patios|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal|Av. 8|Autopista Atalaya|Cerro Pico|Calle 13|Av. 6|Calle 15|Av. 2
*3;Tierra Linda – Terminal – Cenabastos;tierralinda lospatios pinar sanrafael terminal cenabastos;Av. 10 Los Patios|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal

U12;Antonia Santos – Centro;antoniasantos americas centro;
U13;Antonia Santos – Escobal;antoniasantos escobal;
U11;Barrio Bogotá – Cenabastos;barriobogota terminal cenabastos;
U14;Barrio Bogotá – Centro;barriobogota centro;
U10;Barrio Bogotá – Santa Cecilia;barriobogota santacecilia;
U16;Camilo Daza – Guaimaral – Centro;camilodaza guaimaral centro;
U25;Escobal – San Luis – Gaitán;escobal sanluis gaitan;
U24;Escobal – Guaimaral – Gaitán;escobal guaimaral gaitan;
U17;Nidia – El Desierto – Centro;nidia desierto centro;
U18;Nidia – Centro;nidia centro;
U19;Nidia – Américas – Centro;nidia americas centro;
U20;Nidia – Santa Ana – La Unión;nidia santaana launion;
U1;Prados Norte – Faroles – Centro;pradosnorte portico centro;
U2;Prados Norte – Cerro Pico;pradosnorte centro cerropico;
U3;Prados Norte – Libertadores – Centro;pradosnorte hospital centro;
U22;Trigal Norte – Guaimaral – Centro;trigal guaimaral centro;
U21;Trigal Norte – Terminal – Centro;trigal terminal centro;
U9;Belén – Guaimaral – Cenabastos;belen guaimaral cenabastos;
U5;Salado – Centro;salado centro;
U6;Salado – El Pórtico;salado portico;
U7;Salado – Coca Cola;salado cocacola;
M3;Montebello – Villa Silvania;montebello villasilvania;
M4;Montebello – Cenabastos;montebello villasilvania cenabastos;
M5;Montebello – Américas;montebello nogal americas;
@Transguasimales;#43a047;GS
*M12;Tierra Linda – Los Patios – Cenabastos;tierralinda lospatios pinar sanrafael terminal cenabastos;Av. 10 Los Patios|Pinar del Río|San Rafael|Av. 1|Diagonal Santander|Redoma El Terminal
U18;Valles del Rodeo – Hospital – Zulima – Cenabastos;vallesrodeo hospital zulima cenabastos;
U14;Cuberos – Prados del Este;cuberos centro pradoseste;
U1;García Herreros – Los Alpes;garciaherreros villasilvania terminal losalpes;
M6;Montebello – El Nogal – Siglo XXI;montebello nogal siglo21;
M3;Montebello – El Nogal – Nidia;montebello nogal nidia;
M11V2;Montebello – Sevilla – Cenabastos – Guaimaral;montebello sevilla cenabastos guaimaral;
M4;Montebello – El Nogal – Motilones;montebello nogal motilones;
M5;Tierra Linda – García Herreros;tierralinda garciaherreros;
M9;La Sabana – Terminal;lasabana terminal;
M10;La Sabana – Guaimaral – Cenabastos;lasabana guaimaral cenabastos;
@Trans Tonchalá;#6d4c41;TC
U4V1;Belén – San Martín;belen sanmartin;
U5;Belén – Guaimaral – Sevilla;belen guaimaral sevilla;
U4;Belén – Centro – Guaimaral – Cenabastos;belen centro guaimaral cenabastos;
U1;San Martín – Éxito – Camilo Daza;sanmartin camilodaza;
U3;San Martín – Colsag – Camilo Daza;sanmartin colsag camilodaza;
U10;Molinos – Bellavista;molinos bellavista;
U11;Molinos – Zulima – Centro;molinos zulima centro;
U9;Molinos – Sevilla – Centro;molinos sevilla centro;
U7;Colinas – Guaimaral – Camilo Daza;colinas guaimaral camilodaza;
U12;Nuevo Horizonte – Centro;nuevohorizonte centro;
U13;Nuevo Horizonte – Siglo XXI – Guaimaral – Centro;nuevohorizonte siglo21 guaimaral centro;
M1;Montebello – Molinos;montebello terminal molinos;
M2;Montebello – Nuevo Horizonte;montebello nogal nuevohorizonte;
M3;Montebello – Cenabastos;montebello cenabastos;
M4;Montebello – Escobal;montebello nogal escobal;
M5;Montebello – Zulima – Cenabastos;montebello zulima cenabastos;
M6;Montebello – SENA – Cenabastos;montebello sena cenabastos;
M8;Bellavista – Cerro Pico – El Zulia;bellavista cerropico elzulia;
M7;Bellavista – Vía Ureña – El Zulia;bellavista elzulia;
@Trans Oriental;#00897b;TO
U2V1;Aguas Calientes – Cenabastos;aguascalientes americas cenabastos;
U2;Aguas Calientes – Américas;aguascalientes americas;
U12;Villa Silvania – Valles del Rodeo;villasilvania cenabastos vallesrodeo;
U11;Villa Silvania – Colsag – Valles del Rodeo;villasilvania colsag vallesrodeo;
U1;Valles del Rodeo – Escobal;vallesrodeo escobal;
U4;Valles del Rodeo – Villa Silvania;vallesrodeo villasilvania;
M6;Betania – Cenabastos;betania cenabastos;
M8V1;Betania – SENA;betania cenabastos sena;
M4V1;Betania – Motilones;betania motilones;
M3V1;Chaparral – Guaimaral;chaparral guaimaral;
@Coomicro Ltda.;#1e88e5;CM
U1V2;Camilo Daza – Colsag – Bellavista;camilodaza colsag bellavista;
U2;Escalabrini – Gaitán;escalabrini gaitan;
U1V1;Escalabrini – Centro;escalabrini centro;
U9;Santa Ana – SENA – Nuevo Horizonte;santaana sena nuevohorizonte;
U3;Nuevo Horizonte – Belén – SENA;nuevohorizonte belen sena;
U8;Juana Rangel – Américas – Cenabastos – Guaimaral – Centro;juanarangel americas cenabastos guaimaral centro;
U7;Juana Rangel – Centro;juanarangel centro;
M1;Patios – Nuevo Horizonte;lospatios centro nuevohorizonte;
@Corta Distancia S.A.;#fb8c00;CD
M2;Acacios – La Parada;acacios villadelrosario laparada;
M7;La Palmita – Centro – Terminal;palmita centro terminal;
M6;La Palmita – Sevilla – Cenabastos;palmita sevilla cenabastos;
M9;La Palmita – Terminal;palmita terminal;
M4;La Parada – Cenabastos;laparada villadelrosario cenabastos;
M12;La Parada – Cenabastos – Terminal;laparada cenabastos terminal;
M1;La Parada – Terminal;laparada villadelrosario lospatios pinar sanrafael terminal;
*M13;La Parada – Los Estoraques (ruta 1 reestructurada);laparada villadelrosario lospatios pinar sanrafael centro atalaya;El Búnker|Anillo Vial Oriental|La Floresta|Pinar del Río|San Rafael|Barrio Blanco|Latino|Cúcuta 75|Niña Ceci|Belisario|Parque Colón|Av. 1|Av. 3|Intercambiador de Atalaya
M3;La Parada – Villa Silvania;laparada villadelrosario lospatios villasilvania;
@Trans Petrólea;#8e24aa;TP
U6;María Paz – Motilones;mariapaz motilones;
U7V1;Siglo XXI – San Martín;siglo21 sanmartin;
M1;Cenabastos – San Cayetano;cenabastos sancayetano;
2.0;Los Patios – El Zulia;lospatios pinar sanrafael terminal centro atalaya elzulia;
3.0;San Martín – Cenabastos;sanmartin cenabastos;
4.0;María Paz – Antonia Santos;mariapaz antoniasantos;
@Transontiveros;#d81b60;OT
M4;Tierra Linda – Cenabastos;tierralinda lospatios pinar sanrafael terminal cenabastos;Av. 10 Los Patios|San Rafael|Av. 1|Terminal de Transportes
M5;Torres de Cormoranes – Parque Colón;cormoranes motilones americas sevilla terminal usb centro;Motilones|La Laguna|Curva del Pescado|Av. Las Américas|6 de Mayo|Cecilia Castro|Av. Sevilla|Parque Mercedes Ábrego|Calle 13|Calle 15|Unisimón|Parque Colón
PE;Prados del Este – Centro;pradoseste centro;
@Cootransfronorte;#546e7a;CF
U2;Simón Bolívar – Centro;simonbolivar centro;
U3;Simón Bolívar – Guaimaral – Centro;simonbolivar guaimaral centro;
U1;Porvenir – Centro;porvenir centro;
U4;Porvenir – Guaimaral – Centro;porvenir guaimaral centro;
U6;Porvenir – Escobal;porvenir escobal;
`;
