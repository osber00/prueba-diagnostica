-- Postest revisado: docs/POSTEST-INFERENCIAL-MACAJAN.pdf.
-- Versión 3, exclusiva de nuevos intentos de fase postest.
-- No modifica textos, preguntas, respuestas ni intentos del pretest.
-- Textos y enunciados del PDF; alternativas ajustadas solo en extensión.
-- Las cuatro alternativas de cada ítem tienen igual número de palabras.

INSERT INTO texts
  (id, order_index, title, body, genre, illustration_key, instrument_version, display_order_index)
SELECT 35, 30, title, body, genre, illustration_key, 3, 0
  FROM texts WHERE id = 25 AND instrument_version = 2;

INSERT INTO questions
  (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale,
   instrument_version, display_number)
SELECT 300, 35, 300, inference_type, stem, correct_option, 0, rationale, 3, 0
  FROM questions WHERE id = 200 AND instrument_version = 2;

INSERT INTO options (question_id, letter, content)
SELECT 300, letter, content FROM options WHERE question_id = 200;

INSERT INTO texts
  (id, order_index, title, body, genre, illustration_key, instrument_version, display_order_index)
VALUES
  (31, 31, 'Los corrales',
   'En una pequeña granja escolar había dos corrales, A y B, con igual número de gallinas de edades semejantes, ambos grupos recibían la misma cantidad de alimento y disponían de bebederos iguales que se llenaban cada mañana.

Durante una semana especialmente calurosa, los estudiantes observaron una diferencia, en el corral A, ubicado junto a una pared metálica que recibía el sol de la tarde, la temperatura alcanzaba entre 34 y 36 °C, hacia las dos de la tarde, el bebedero quedaba casi vacío y durante esos días disminuyó la cantidad de huevos recogidos, en el corral B, donde la temperatura era unos cinco grados menor, todavía quedaba agua al terminar la tarde y la producción se mantuvo cercana a lo habitual.

Algunos estudiantes sospecharon que el alimento del corral A podía estar causando la diferencia. Revisaron los sacos y comprobaron que ambos corrales estaban recibiendo productos del mismo lote.

La semana siguiente colocaron una malla sobre el costado más expuesto del corral A, la temperatura disminuyó varios grados, quedó agua en el bebedero durante la tarde y la cantidad de huevos volvió a aproximarse a la del corral B, no se modificó el alimento.',
   'expositivo', 'postest', 3, 1),
  (32, 32, 'Los sacos de maíz',
   'Después de una cosecha, una familia almacenó doce sacos de maíz que habían sido secados durante el mismo tiempo, seis quedaron colocados directamente sobre un piso de concreto junto a una pared exterior, los otros seis fueron ubicados sobre una plataforma de madera, unos centímetros por encima del piso y en otro extremo del mismo depósito.

Durante cuatro noches consecutivas llovió con intensidad, al revisar los sacos, los que estaban junto a la pared exterior presentaban humedad principalmente en su parte inferior y algunos granos habían comenzado a desprender un olor diferente, los sacos sobre la plataforma continuaban secos.

La familia revisó el techo pensando que podía existir alguna filtración, pero no encontró goteras, la parte superior de los sacos afectados también permanecía seca. Sin embargo, cerca del piso de la pared exterior podía observarse una franja oscura que se hacía más visible después de cada lluvia.

Unas semanas después almacenaron otra cantidad de maíz, esta vez colocaron todos los sacos sobre plataformas de madera, incluidos los que estaban cerca de aquella pared, durante varios días volvió a llover con intensidad semejante, cuando revisaron el depósito, ninguno de los sacos presentó la humedad que se había observado anteriormente.',
   'expositivo', 'postest', 3, 2),
  (33, 33, 'Los portátiles de la sala de informática',
   'En la sala de informática de la institución había diez portátiles del mismo modelo, antes de una actividad, cinco fueron conectados durante dos horas a una regleta ubicada en una mesa del fondo y los otros cinco se conectaron directamente a tomas de la pared.

Al terminar ese tiempo, los equipos conectados directamente mostraban cargas cercanas al 90 %, en cambio, los que habían utilizado la regleta estaban entre el 45 % y el 55 %, todos habían comenzado con porcentajes de batería similares.

Inicialmente se pensó que los cinco portátiles de la mesa podían tener baterías deterioradas, para comprobarlo, al día siguiente intercambiaron los equipos: los portátiles que habían cargado poco fueron conectados directamente a la pared, mientras otros cinco se conectaron a la misma regleta, después de dos horas, los primeros alcanzaron porcentajes cercanos al 90 %, pero los conectados a la regleta volvieron a mostrar cargas mucho menores.

Finalmente se sustituyó aquella regleta por otra, sin cambiar cargadores ni portátiles, los cinco equipos conectados en la mesa alcanzaron porcentajes semejantes a los de los equipos conectados directamente a la pared.',
   'expositivo', 'postest', 3, 3),
  (34, 34, 'El filtro del sistema de agua',
   'Una comunidad utiliza una pequeña bomba para trasladar agua desde un depósito hasta un tanque elevado, entre el depósito y la bomba existe un filtro que impide el paso de hojas, arena y otros materiales.

Durante varias semanas, llenar el tanque tomaba aproximadamente cuarenta minutos, después de una fuerte lluvia, el agua del depósito presentó mayor cantidad de sedimentos, dos días más tarde, el llenado comenzó a tardar casi una hora y veinte minutos.

Algunos habitantes pensaron que la bomba estaba perdiendo potencia, sin embargo, el motor mantenía el mismo sonido y el suministro eléctrico no había presentado interrupciones, al revisar el sistema encontraron que el filtro contenía una gran cantidad de arena y pequeños restos vegetales.

Limpiaron el filtro sin realizar ninguna modificación en la bomba, en el siguiente llenado, el tanque volvió a completarse en poco más de cuarenta minutos.

Un mes después observaron nuevamente que el tiempo comenzaba a aumentar, aunque todavía no alcanzaba una hora, al revisar el filtro encontraron una cantidad moderada de sedimentos acumulados.',
   'expositivo', 'postest', 3, 4);

INSERT INTO questions
  (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale,
   instrument_version, display_number)
VALUES
  (301, 31, 301, 'causal', '¿Cuál es la explicación mejor sustentada para la disminución de huevos observada inicialmente en el corral A?', 'B', 1,
   'Integra el calor mayor, la menor disponibilidad de agua y la recuperación posterior sin cambiar el alimento.', 3, 1),
  (302, 31, 302, 'causal', '¿Qué evidencia permite relacionar con mayor fuerza la malla instalada con el cambio posterior observado?', 'D', 1,
   'Tras colocar la malla disminuyó el calor y mejoraron agua y producción, manteniéndose el alimento.', 3, 2),
  (303, 31, 303, 'predictiva', 'Si durante otra semana calurosa se mantiene la malla, pero el bebedero del corral A se llena solamente hasta la mitad cada mañana, ¿qué resultado es más probable?', 'C', 1,
   'La malla reduce el calor, pero no garantiza suficiente agua si se reduce a la mitad la reserva diaria.', 3, 3),
  (304, 31, 304, 'predictiva', 'Si se instala un material que evita que la pared metálica eleve tanto la temperatura, pero se retira la malla, ¿qué resultado sería más coherente con lo observado?', 'A', 1,
   'El efecto se relaciona con reducir el calentamiento, no exclusivamente con utilizar una malla.', 3, 4),
  (305, 32, 305, 'causal', '¿Cuál es la explicación más consistente para la humedad de los primeros sacos almacenados junto a la pared?', 'C', 1,
   'La humedad inferior, el techo sin goteras y la franja junto al piso apoyan la entrada de humedad desde esa superficie.', 3, 5),
  (306, 32, 306, 'causal', '¿Qué elemento de la segunda experiencia apoya con mayor fuerza esa explicación?', 'A', 1,
   'Separar los sacos del piso evitó que reapareciera el problema incluso cerca de la pared y bajo lluvias semejantes.', 3, 6),
  (307, 32, 307, 'predictiva', 'Si en una próxima cosecha algunos sacos vuelven a colocarse directamente sobre el piso junto a esa pared durante varios días lluviosos, ¿qué es más razonable esperar?', 'D', 1,
   'Restablecer el contacto con el piso húmedo recupera la condición asociada con el problema inicial.', 3, 7),
  (308, 32, 308, 'predictiva', 'Si todos los sacos permanecen sobre plataformas, pero aparece una gotera directamente sobre uno de ellos, ¿qué conclusión sería más razonable?', 'B', 1,
   'Una plataforma aísla del piso, pero no impide una nueva entrada de agua desde una gotera.', 3, 8),
  (309, 33, 309, 'causal', '¿Qué explicación se encuentra mejor sustentada por los resultados de las diferentes pruebas?', 'D', 1,
   'La carga baja siguió a la primera regleta al intercambiar equipos y desapareció al sustituirla.', 3, 9),
  (310, 33, 310, 'causal', '¿Por qué el intercambio de los portátiles fue importante para identificar la causa del problema?', 'B', 1,
   'El intercambio distingue un problema del punto de conexión de uno propio de los mismos portátiles.', 3, 10),
  (311, 33, 311, 'predictiva', 'Si la primera regleta se lleva a otra aula y se conectan allí varios portátiles que normalmente cargan bien, ¿qué resultado sería más coherente con los datos?', 'A', 1,
   'El problema siguió a la regleta con equipos diferentes; trasladarla permite esperar una dificultad semejante.', 3, 11),
  (312, 33, 312, 'predictiva', 'Si con la nueva regleta cuatro equipos alcanzan cerca del 90 %, pero uno permanece alrededor del 50 % en varias pruebas, ¿qué interpretación sería más razonable?', 'C', 1,
   'Una falla persistente en un solo equipo con la nueva regleta justifica investigar ese equipo o su cargador.', 3, 12),
  (313, 34, 313, 'causal', '¿Cuál es la explicación mejor sustentada para el aumento inicial del tiempo necesario para llenar el tanque?', 'A', 1,
   'Relaciona sedimentos, filtro cargado y mayor tiempo, con recuperación tras limpiar sin modificar la bomba.', 3, 13),
  (314, 34, 314, 'causal', '¿Qué evidencia permite descartar con mayor fuerza que la bomba fuera la causa principal del problema?', 'C', 1,
   'La recuperación del tiempo después de limpiar, sin reparar la bomba, debilita una falla principal de esta.', 3, 14),
  (315, 34, 315, 'predictiva', 'Si después de otra lluvia intensa el agua vuelve a traer muchos sedimentos y el filtro no se revisa durante varios días, ¿qué es más probable?', 'B', 1,
   'La acumulación de sedimentos estuvo asociada con tiempos crecientes tanto al inicio como un mes después.', 3, 15),
  (316, 34, 316, 'predictiva', 'Si se limpia el filtro regularmente durante una temporada de lluvias, pero posteriormente el tanque comienza a tardar mucho más aun con el filtro limpio, ¿qué conclusión sería más prudente?', 'D', 1,
   'Un retraso con filtro limpio no reproduce el patrón anterior y exige investigar otras causas del sistema.', 3, 16);

INSERT INTO options (question_id, letter, content) VALUES
  (301, 'A', 'El alimento suministrado al corral A perdió su calidad debido al lugar donde permanecía almacenado habitualmente.'),
  (301, 'B', 'Las condiciones de mayor calor y disponibilidad reducida de agua afectaron a las gallinas del corral.'),
  (301, 'C', 'Las gallinas del corral A comenzaron a producir menos debido a diferencias relacionadas con su edad.'),
  (301, 'D', 'El bebedero del corral A probablemente perdió agua mediante una pequeña fuga que pasó totalmente inadvertida.'),
  (302, 'A', 'Los dos corrales continuaron recibiendo diariamente la misma cantidad de alimento procedente exactamente del mismo lote.'),
  (302, 'B', 'El corral B mantuvo condiciones semejantes durante las dos semanas en que se hicieron observaciones escolares.'),
  (302, 'C', 'Los estudiantes comprobaron que ninguno de los dos bebederos utilizados en los corrales presentaba daños visibles.'),
  (302, 'D', 'Al disminuir el calor, mejoraron la disponibilidad de agua y la producción sin cambiar el alimento.'),
  (303, 'A', 'La producción aumentará nuevamente porque la malla compensará completamente la reducción de agua disponible cada día.'),
  (303, 'B', 'La producción permanecerá igual porque la cantidad inicial de agua no influyó en las observaciones previas.'),
  (303, 'C', 'Podría volver a faltar agua durante el día y disminuir nuevamente la cantidad de huevos obtenidos.'),
  (303, 'D', 'El corral A producirá más huevos que el B porque tendrá menor temperatura durante la tarde.'),
  (304, 'A', 'Podrían mantenerse condiciones semejantes a las obtenidas antes con la malla si realmente disminuye el calentamiento.'),
  (304, 'B', 'La producción disminuiría necesariamente porque únicamente una malla puede modificar las condiciones ambientales actuales del corral.'),
  (304, 'C', 'Los bebederos quedarían vacíos más rápidamente porque la pared dejaría de almacenar calor durante la tarde.'),
  (304, 'D', 'La cantidad de huevos aumentaría por encima de lo habitual aunque no cambien las otras condiciones.'),
  (305, 'A', 'El maíz de esos sacos conservaba inicialmente más humedad desde el momento mismo en que fue cosechado.'),
  (305, 'B', 'Una filtración desde el techo mojaba primero la parte baja sin afectar la superficie de los sacos.'),
  (305, 'C', 'La humedad cercana al piso alcanzaba los sacos almacenados que permanecían en contacto directo con esa superficie.'),
  (305, 'D', 'La pared exterior impedía que el maíz pudiera terminar adecuadamente su proceso natural de secado estando almacenado.'),
  (306, 'A', 'Al aislar los sacos del piso mediante las plataformas, el problema no reapareció pese a nuevas lluvias.'),
  (306, 'B', 'Durante la segunda experiencia se utilizó maíz procedente de una nueva cosecha realizada unas pocas semanas después.'),
  (306, 'C', 'Los sacos permanecieron almacenados por la familia aproximadamente en el mismo depósito utilizado en la primera ocasión.'),
  (306, 'D', 'La lluvia volvió a presentarse durante varios días mientras las familias revisaban regularmente el maíz que almacenaban.'),
  (307, 'A', 'Permanecerán secos porque la primera situación observada solo podía producirse una vez en el mismo depósito.'),
  (307, 'B', 'Se humedecerán solamente en su parte superior debido a la dirección habitual del agua de lluvia.'),
  (307, 'C', 'Permanecerán iguales a los sacos elevados porque todos contienen maíz previamente secado durante el mismo tiempo.'),
  (307, 'D', 'Presentarán mayor riesgo de humedad que aquellos que permanezcan separados del piso mediante plataformas de madera.'),
  (308, 'A', 'Ningún saco podrá humedecerse porque la plataforma de madera elimina cualquier posible entrada directa de agua.'),
  (308, 'B', 'Ese saco podría humedecerse por una causa claramente distinta de la identificada en la primera experiencia.'),
  (308, 'C', 'Todos los sacos deberían desarrollar humedad en su parte inferior aunque estén totalmente separados del piso.'),
  (308, 'D', 'La aparición de una gotera demostraría que la pared nunca tuvo relación con el problema inicial.'),
  (309, 'A', 'Los cinco cargadores utilizados en la mesa presentaban problemas de carga que aparecían solamente en ciertos momentos.'),
  (309, 'B', 'Las baterías de varios portátiles funcionaban de manera irregular según el lugar del aula donde fueran utilizadas.'),
  (309, 'C', 'Las tomas de la pared proporcionaban una cantidad excesiva de energía eléctrica a los equipos conectados directamente.'),
  (309, 'D', 'La primera regleta estaba relacionada con la menor carga obtenida por los equipos que se conectaban allí.'),
  (310, 'A', 'Permitió demostrar que todos los portátiles utilizados necesitaban exactamente el mismo tiempo para completar su carga de batería.'),
  (310, 'B', 'Mostró que la carga baja seguía al punto de conexión y no permanecía asociada a los mismos equipos.'),
  (310, 'C', 'Permitió comprobar que todos los cargadores funcionaban únicamente cuando estaban conectados a las tomas eléctricas de la pared.'),
  (310, 'D', 'Mostró que algunos equipos podían almacenar más energía dependiendo del porcentaje de batería con que iniciaban cada prueba.'),
  (311, 'A', 'Es probable que vuelvan a obtener cargas de batería menores mientras se utilice aquella regleta para conectarlos.'),
  (311, 'B', 'Cargarán normalmente porque una regleta solamente puede presentar problemas dentro de la primera sala de informática escolar.'),
  (311, 'C', 'Alcanzarán más carga que antes porque los equipos utilizados serán diferentes a los de la primera prueba.'),
  (311, 'D', 'No podrá ocurrir ninguna diferencia de carga porque todos los equipos portátiles utilizan cargadores del mismo modelo.'),
  (312, 'A', 'La nueva regleta presenta exactamente el mismo problema que tenía la regleta utilizada en las pruebas anteriores.'),
  (312, 'B', 'La toma eléctrica de la mesa dejó de funcionar correctamente para todos los equipos portátiles conectados allí.'),
  (312, 'C', 'Sería necesario investigar un problema particular del equipo o de su cargador, no solo de la regleta.'),
  (312, 'D', 'Los otros cuatro equipos conectados recibieron mucha más electricidad porque comenzaron con porcentajes de batería inicialmente superiores.'),
  (313, 'A', 'La acumulación de materiales en el filtro redujo el paso del agua aunque la bomba continuaba funcionando.'),
  (313, 'B', 'La bomba perdió temporalmente parte de su potencia debido a la lluvia caída durante los días anteriores.'),
  (313, 'C', 'El tanque elevado comenzó a recibir menos agua porque su capacidad total aumentó después de las lluvias.'),
  (313, 'D', 'El suministro de energía eléctrica disminuyó durante todos los llenados aunque no se registraron interrupciones claramente visibles.'),
  (314, 'A', 'El depósito contenía una mayor cantidad de arena y restos vegetales después de la fuerte lluvia.'),
  (314, 'B', 'El motor continuaba produciendo aproximadamente el mismo sonido habitual durante todo el proceso completo de llenado.'),
  (314, 'C', 'El tiempo habitual regresó después de limpiar el filtro sin realizar ninguna reparación en la bomba.'),
  (314, 'D', 'Los habitantes habían utilizado el mismo sistema hidráulico durante varias semanas antes de observar el problema.'),
  (315, 'A', 'El tiempo de llenado disminuirá porque una mayor cantidad de sedimentos empujará el agua hacia la bomba.'),
  (315, 'B', 'El tiempo de llenado podría aumentar nuevamente a medida que los materiales se acumulen en el filtro.'),
  (315, 'C', 'El tanque recibirá exactamente la misma cantidad de agua por minuto aunque el filtro se vaya obstruyendo.'),
  (315, 'D', 'La bomba del sistema dejará de funcionar necesariamente desde el primer momento en que aparezcan nuevos sedimentos.'),
  (316, 'A', 'Los sedimentos acumulados continúan siendo necesariamente la única explicación posible para cualquier retraso observado en todo el sistema.'),
  (316, 'B', 'El filtro del sistema debe estar obstruido aunque una revisión cuidadosa y detallada indique que permanece completamente limpio.'),
  (316, 'C', 'El aumento del tiempo demuestra que las lluvias dañan directamente el tanque elevado con el paso del tiempo.'),
  (316, 'D', 'Sería necesario investigar otra posible causa del sistema porque el patrón anterior ya no explica bien el problema.');
