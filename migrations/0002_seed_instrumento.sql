-- Migración 0002 — Instrumento
-- 4 textos · 16 ítems calificables (8 causales + 8 predictivos) · 64 opciones
-- Más 1 ítem de calentamiento no calificable.
--
-- Clave confirmada por el investigador:
--   Texto 1: B D A C   Texto 2: C A D B   Texto 3: B D A C   Texto 4: C A D B
--
-- El patrón es regular, por eso el Worker baraja las opciones por estudiante
-- (columna attempts.option_seed). El orden almacenado aquí es el canónico.

-- ===========================================================================
-- TEXTO DE CALENTAMIENTO (order_index = 0, no calificable)
-- ===========================================================================

INSERT INTO texts (id, order_index, title, body, genre, illustration_key) VALUES
(5, 0, 'Ejemplo para practicar',
'Camilo salió de su casa con la maleta al hombro. Cuando llegó a la esquina se detuvo, miró el cielo gris y regresó rápidamente. Poco después salió de nuevo, esta vez con una sombrilla en la mano.',
'narrativo', 'calentamiento');

INSERT INTO questions (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale) VALUES
(100, 5, 0, 'causal',
'¿Por qué Camilo regresó a su casa?',
'B', 0,
'Ítem de práctica. Enseña a combinar pistas dispersas: cielo gris + regreso + salida con sombrilla.');

INSERT INTO options (question_id, letter, content) VALUES
(100, 'A', 'Porque había olvidado la maleta en la sala de su casa.'),
(100, 'B', 'Porque vio que podía llover y fue a buscar una sombrilla.'),
(100, 'C', 'Porque la esquina estaba cerrada ese día por reparaciones.'),
(100, 'D', 'Porque decidió que ya no iba a salir a ninguna parte.');

-- ===========================================================================
-- TEXTO 1 — La huerta escolar
-- ===========================================================================

INSERT INTO texts (id, order_index, title, body, genre, illustration_key) VALUES
(1, 1, 'La huerta escolar',
'Durante varias semanas, un grupo de estudiantes de noveno estuvo encargado de cuidar la huerta escolar. Al comienzo observaron que algunas plantas de tomate crecían menos que las demás. Las plantas más débiles se encontraban en un extremo de la huerta donde el suelo se secaba con mayor rapidez y recibía sol directo durante casi toda la tarde.

Sin cambiar las semillas ni trasladar las plantas, los estudiantes colocaron hojas secas alrededor de la base y organizaron turnos de riego al finalizar la jornada escolar. Una semana después observaron que el suelo conservaba la humedad durante más tiempo y las plantas comenzaron a verse más firmes.

El viernes, debido a una actividad institucional, nadie realizó el riego y durante el fin de semana hizo mucho calor. Al regresar el lunes, varias hojas de las plantas ubicadas en aquel extremo estaban caídas. El grupo decidió conservar la cubierta de hojas secas y reforzar los turnos de riego durante los días más calurosos.',
'expositivo', 'huerta');

INSERT INTO questions (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale) VALUES
(1, 1, 1, 'causal',
'¿Por qué las plantas ubicadas en uno de los extremos de la huerta probablemente crecían menos que las demás?',
'B', 1,
'El texto asocia esa zona con suelo que se seca rápido y sol directo toda la tarde. Se descarta A porque el texto afirma que no se cambiaron las semillas.'),

(2, 1, 2, 'causal',
'¿Qué explica mejor que las plantas comenzaran a verse más firmes después de una semana?',
'D', 1,
'Las dos únicas acciones introducidas fueron la cubierta de hojas secas y los turnos de riego, y el efecto observado fue la conservación de humedad.'),

(3, 1, 3, 'predictiva',
'Si durante tres días consecutivos vuelve a hacer mucho calor y nadie riega la huerta, ¿qué es más probable que ocurra?',
'A', 1,
'El texto ya presenta el precedente del fin de semana sin riego: las hojas de ese extremo se cayeron primero.'),

(4, 1, 4, 'predictiva',
'Si los estudiantes mantienen la cubierta de hojas secas y cumplen los turnos de riego durante los días calurosos, ¿qué resultado es más probable?',
'C', 1,
'Proyecta el efecto ya verificado en el texto: mayor retención de humedad y menor riesgo de marchitez.');

INSERT INTO options (question_id, letter, content) VALUES
(1, 'A', 'Porque las semillas usadas en esa zona tenían menor capacidad de crecimiento.'),
(1, 'B', 'Porque recibían más sol y el suelo perdía humedad con rapidez.'),
(1, 'C', 'Porque las hojas secas impedían que las raíces absorbieran suficiente agua.'),
(1, 'D', 'Porque los estudiantes aplicaban demasiada agua durante las horas de la mañana.'),

(2, 'A', 'Porque las plantas recibieron menos radiación durante los días posteriores.'),
(2, 'B', 'Porque el suelo cambió de composición por efecto del calor acumulado.'),
(2, 'C', 'Porque las raíces crecieron más al disminuir su exposición directa al sol.'),
(2, 'D', 'Porque la cobertura y el riego ayudaron a conservar mejor la humedad.'),

(3, 'A', 'Las plantas del extremo soleado podrían marchitarse antes que las demás.'),
(3, 'B', 'El crecimiento podría mantenerse sin cambios importantes durante esos tres días.'),
(3, 'C', 'Las plantas podrían fortalecerse al adaptarse a la escasez temporal de agua.'),
(3, 'D', 'El suelo podría conservar más humedad debido al aumento de temperatura.'),

(4, 'A', 'La cubierta podría reducir la entrada de luz y limitar el crecimiento.'),
(4, 'B', 'Las plantas podrían necesitar menos cuidados durante los siguientes días calurosos.'),
(4, 'C', 'El suelo conservaría mejor la humedad y disminuiría el riesgo de marchitez.'),
(4, 'D', 'El crecimiento de las plantas podría igualarse rápidamente gracias al mismo cuidado.');

-- ===========================================================================
-- TEXTO 2 — El recorrido hacia la escuela
-- ===========================================================================

INSERT INTO texts (id, order_index, title, body, genre, illustration_key) VALUES
(2, 2, 'El recorrido hacia la escuela',
'Durante la época seca, el transporte escolar que recoge a varios estudiantes de sectores cercanos suele llegar a la Institución Educativa a las 6:40 de la mañana. Sin embargo, después de una noche de fuertes lluvias, un martes el vehículo llegó casi veinticinco minutos más tarde.

El conductor explicó que uno de los sectores bajos del camino tenía bastante agua acumulada y que el paso de varias motocicletas había dejado huellas profundas en el terreno. Ese mismo día, algunos estudiantes que viven relativamente cerca llegaron caminando antes que el transporte escolar. Sus familias habían escuchado la lluvia durante la noche y decidieron que salieran de casa con mayor anticipación.

En la radio local informaron que las lluvias podrían continuar durante los siguientes días. Algunos habitantes de la comunidad propusieron limpiar las cunetas y pequeños canales de desagüe que se encontraban cubiertos de tierra y hojas antes de que ocurriera otro aguacero.',
'narrativo', 'transporte');

INSERT INTO questions (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale) VALUES
(5, 2, 5, 'causal',
'¿Cuál es la explicación más probable para el retraso del transporte escolar?',
'C', 1,
'El conductor menciona dos condiciones del camino: agua acumulada y huellas profundas. Ambas explican la pérdida de velocidad.'),

(6, 2, 6, 'causal',
'¿Por qué algunos estudiantes que fueron caminando lograron llegar antes que el transporte escolar?',
'A', 1,
'El texto indica que sus familias oyeron la lluvia y decidieron que salieran con mayor anticipación.'),

(7, 2, 7, 'predictiva',
'Si las lluvias continúan y las cunetas permanecen obstruidas, ¿qué es más probable que suceda en los próximos días?',
'D', 1,
'Mantener las mismas condiciones causales debe reproducir el mismo efecto ya observado el martes.'),

(8, 2, 8, 'predictiva',
'Si la comunidad limpia los canales de desagüe antes de una nueva lluvia, ¿qué resultado sería más razonable esperar?',
'B', 1,
'Eliminar la obstrucción actúa sobre la causa identificada: la acumulación de agua sobre el camino.');

INSERT INTO options (question_id, letter, content) VALUES
(5, 'A', 'Porque el conductor inició el recorrido más tarde de lo acostumbrado ese día.'),
(5, 'B', 'Porque el vehículo realizó varias paradas adicionales durante el trayecto escolar.'),
(5, 'C', 'Porque el agua acumulada y el camino deteriorado hicieron más lento el recorrido.'),
(5, 'D', 'Porque algunas familias retrasaron la salida de los estudiantes que usaban transporte.'),

(6, 'A', 'Porque anticiparon posibles dificultades y salieron de sus casas con mayor tiempo.'),
(6, 'B', 'Porque el transporte realizó más paradas debido a las condiciones del camino.'),
(6, 'C', 'Porque los estudiantes eligieron una ruta peatonal más corta que la vehicular.'),
(6, 'D', 'Porque la lluvia fue menos intensa en los sectores donde ellos vivían.'),

(7, 'A', 'El terreno podría volverse más firme aunque continuara acumulándose agua en las cunetas.'),
(7, 'B', 'El recorrido podría ser más rápido porque las huellas facilitarían el paso vehicular.'),
(7, 'C', 'El transporte podría conservar su horario si mantiene la misma ruta habitual.'),
(7, 'D', 'Podrían repetirse acumulaciones de agua y nuevos retrasos durante el recorrido.'),

(8, 'A', 'El agua de lluvia podría permanecer menos tiempo en algunos sectores elevados.'),
(8, 'B', 'El agua podría evacuar mejor y reducirse su acumulación sobre el camino.'),
(8, 'C', 'Los estudiantes podrían tardar menos porque la ruta peatonal sería más corta.'),
(8, 'D', 'Los vehículos podrían generar menos huellas aunque el terreno permaneciera húmedo.');

-- ===========================================================================
-- TEXTO 3 — Una forma diferente de leer
-- ===========================================================================

INSERT INTO texts (id, order_index, title, body, genre, illustration_key) VALUES
(3, 3, 'Una forma diferente de leer',
'En las primeras actividades de lectura del grado noveno, varios estudiantes evitaban leer en voz alta y, cuando el docente realizaba una pregunta, algunos respondían únicamente con una o dos palabras.

El profesor decidió probar una dinámica diferente. Seleccionó textos breves relacionados con temas propuestos por los propios estudiantes. Primero cada estudiante leía en silencio durante cinco minutos. Luego trabajaban en parejas para comparar las pistas que habían encontrado en el texto y, finalmente, compartían sus conclusiones con el grupo.

Durante las dos primeras sesiones aumentó el número de estudiantes que participaban voluntariamente. Algunos que antes casi no hablaban comenzaron incluso a explicar qué pistas habían utilizado para llegar a sus respuestas.

En la tercera sesión, por falta de tiempo, el profesor entregó un nuevo texto pero eliminó la conversación en parejas. La participación disminuyó y varias respuestas se limitaron a repetir información que aparecía directamente en la lectura. Para la siguiente sesión decidió recuperar la conversación en parejas, pero pidió que cada estudiante escribiera primero su propia predicción.',
'narrativo', 'lectura');

INSERT INTO questions (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale) VALUES
(9, 3, 9, 'causal',
'¿Qué hecho permite pensar con mayor fundamento que la conversación en parejas ayudaba a la participación de los estudiantes?',
'B', 1,
'Al retirar la variable, el efecto desapareció. Es la evidencia más fuerte de relación causal disponible en el texto.'),

(10, 3, 10, 'causal',
'¿Por qué es razonable relacionar la eliminación del trabajo en parejas con el aumento de respuestas literales?',
'D', 1,
'El espacio de comparación de pistas era justamente el momento donde se construía la inferencia.'),

(11, 3, 11, 'predictiva',
'¿Qué es más probable que ocurra al pedir que cada estudiante escriba una predicción antes de conversar con su compañero?',
'A', 1,
'REVISAR: la opción correcta describe casi literalmente la consigna. Es el ítem más débil del instrumento; se vigilará su índice de discriminación.'),

(12, 3, 12, 'predictiva',
'Si en las próximas sesiones se mantiene la lectura individual seguida del intercambio de pistas en parejas, ¿qué resultado sería más coherente con lo ocurrido hasta ahora?',
'C', 1,
'Extiende la tendencia ya observada: los estudiantes empezaron a explicar qué pistas usaban.');

INSERT INTO options (question_id, letter, content) VALUES
(9, 'A', 'Los textos utilizados durante las actividades tenían una extensión relativamente breve.'),
(9, 'B', 'La participación disminuyó cuando se eliminó el intercambio de ideas en parejas.'),
(9, 'C', 'El profesor organizaba actividades de lectura durante cada una de las sesiones.'),
(9, 'D', 'Los estudiantes permanecían varios minutos leyendo los textos de manera individual.'),

(10, 'A', 'Porque los estudiantes tuvieron menos tiempo para recordar el contenido de la lectura.'),
(10, 'B', 'Porque el nuevo texto exigía recordar más información literal que los anteriores.'),
(10, 'C', 'Porque el docente pidió respuestas más breves durante el desarrollo de la actividad.'),
(10, 'D', 'Porque se eliminó el espacio para comparar pistas antes de responder individualmente.'),

(11, 'A', 'Cada estudiante formulará primero una idea propia antes de compararla con otra.'),
(11, 'B', 'Cada estudiante podrá anticipar el contenido sin revisar todas las pistas disponibles.'),
(11, 'C', 'Las predicciones iniciales tenderán a ser semejantes antes del intercambio en parejas.'),
(11, 'D', 'El diálogo posterior tendrá menos importancia porque la respuesta estará escrita.'),

(12, 'A', 'Los estudiantes podrían concentrarse más en repetir información explícita de los textos.'),
(12, 'B', 'La participación podría mantenerse igual porque la dinámica dejaría de ser novedosa.'),
(12, 'C', 'Más estudiantes podrían explicar y justificar sus conclusiones utilizando pistas del texto.'),
(12, 'D', 'Los estudiantes podrían depender de sus compañeros para responder las preguntas planteadas.');

-- ===========================================================================
-- TEXTO 4 — Después de la lluvia
-- ===========================================================================

INSERT INTO texts (id, order_index, title, body, genre, illustration_key) VALUES
(4, 4, 'Después de la lluvia',
'Después de varios días de lluvia, un grupo de estudiantes realizó una observación en un pequeño arroyo cercano. El agua, que días antes se veía relativamente clara, presentaba ahora un color marrón. Al caminar por la orilla encontraron que, en una pendiente sin vegetación, el agua de lluvia había formado pequeños canales que arrastraban tierra suelta hacia el arroyo.

Más adelante observaron bolsas y empaques plásticos atrapados entre las raíces de algunos árboles. Cerca de la carretera también encontraron residuos abandonados. Los estudiantes comprendieron que estaban observando dos problemas que podían presentarse al mismo tiempo, pero que no necesariamente tenían la misma causa.

Como propuesta, decidieron sembrar pasto y otras plantas en la pendiente y solicitar la instalación de recipientes para depositar residuos cerca de la carretera. Un mes después, la vegetación ya cubría buena parte del terreno, pero los recipientes todavía no habían sido instalados y algunas personas continuaban dejando residuos en la zona.',
'expositivo', 'arroyo');

INSERT INTO questions (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale) VALUES
(13, 4, 13, 'causal',
'¿Cuál es la causa más probable del color marrón que presentó el agua después de las lluvias?',
'C', 1,
'El texto describe la cadena completa: pendiente sin vegetación, canales de agua, arrastre de tierra suelta hacia el arroyo.'),

(14, 4, 14, 'causal',
'¿Cuál es la explicación más probable de la presencia de bolsas y empaques atrapados entre las raíces?',
'A', 1,
'Conecta los residuos abandonados cerca de la carretera con el transporte por escorrentía hasta el arroyo.'),

(15, 4, 15, 'predictiva',
'Si la vegetación continúa creciendo y cubriendo la pendiente, ¿qué es más probable que ocurra durante futuras lluvias?',
'D', 1,
'Actúa sobre la causa de la erosión: la ausencia de vegetación en la pendiente.'),

(16, 4, 16, 'predictiva',
'Si no se instalan recipientes y las personas continúan dejando residuos cerca de la carretera, ¿qué es más probable que ocurra aunque disminuya el arrastre de tierra?',
'B', 1,
'Exige separar los dos problemas: resolver la erosión no resuelve la contaminación por plásticos.');

INSERT INTO options (question_id, letter, content) VALUES
(13, 'A', 'Las raíces de los árboles modificaron el color natural del agua del arroyo.'),
(13, 'B', 'La ausencia de recipientes produjo directamente el cambio de color del agua.'),
(13, 'C', 'La lluvia arrastró tierra suelta desde la pendiente hasta el cauce del arroyo.'),
(13, 'D', 'El paso de los estudiantes removió sedimentos acumulados cerca de la orilla.'),

(14, 'A', 'Parte de los residuos abandonados fue transportada por el agua hasta el arroyo.'),
(14, 'B', 'Algunos residuos fueron dejados directamente allí por quienes visitaron el arroyo.'),
(14, 'C', 'Las lluvias desprendieron residuos que permanecían enterrados dentro de la pendiente.'),
(14, 'D', 'El viento trasladó residuos desde la carretera hasta las raíces de los árboles.'),

(15, 'A', 'La vegetación podría retener mayor cantidad de residuos cerca de la pendiente.'),
(15, 'B', 'El agua podría circular más lentamente por la presencia de nuevas raíces.'),
(15, 'C', 'La pendiente podría acumular más tierra suelta alrededor de la vegetación.'),
(15, 'D', 'Disminuiría la cantidad de suelo arrastrado hacia el arroyo durante las lluvias.'),

(16, 'A', 'Los residuos podrían quedar retenidos en la vegetación cercana al camino.'),
(16, 'B', 'Los plásticos podrían seguir llegando al arroyo y acumulándose en algunos sectores.'),
(16, 'C', 'El agua podría verse más clara aunque continuara recibiendo residuos plásticos.'),
(16, 'D', 'Los residuos podrían concentrarse cerca de la carretera durante los días secos.');
