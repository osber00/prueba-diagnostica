-- Migración 0003 - Instrumento revisado, versión 2
-- Conserva los intentos iniciados con la versión 1 y asigna la versión 2
-- únicamente a los intentos nuevos.

ALTER TABLE texts ADD COLUMN instrument_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE texts ADD COLUMN display_order_index INTEGER;
UPDATE texts SET display_order_index = order_index WHERE display_order_index IS NULL;

ALTER TABLE questions ADD COLUMN instrument_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE questions ADD COLUMN display_number INTEGER;
UPDATE questions SET display_number = number WHERE display_number IS NULL;

ALTER TABLE attempts ADD COLUMN instrument_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX idx_texts_version_order
  ON texts(instrument_version, display_order_index);
CREATE INDEX idx_questions_version_number
  ON questions(instrument_version, display_number);
CREATE INDEX idx_attempts_instrument_version
  ON attempts(instrument_version, status);

-- El calentamiento se duplica para que cada versión sea autocontenida.
INSERT INTO texts
  (id, order_index, title, body, genre, illustration_key, instrument_version, display_order_index)
VALUES
  (25, 20, 'Ejemplo para practicar',
   'Camilo salió de su casa con la maleta al hombro. Cuando llegó a la esquina se detuvo, miró el cielo gris y regresó rápidamente. Poco después salió de nuevo, esta vez con una sombrilla en la mano.',
   'narrativo', 'calentamiento', 2, 0),
  (21, 21, 'El tanque de la huerta',
   'En la huerta escolar se utiliza un tanque que se llena completamente cada lunes. Durante varias semanas, cuando había seis eras sembradas y se regaban una vez al día, el agua alcanzaba normalmente hasta el viernes.

A comienzos de septiembre los estudiantes prepararon dos eras nuevas. Esa misma semana hubo días especialmente calurosos y se decidió regar todas las plantas dos veces al día. El miércoles por la tarde el tanque quedó vacío.

Los estudiantes pensaron inicialmente que podía existir una fuga. Sin embargo, revisaron el tanque, las mangueras y las llaves y no encontraron daños ni zonas mojadas alrededor. Además, la válvula permanecía cerrada cuando nadie estaba utilizando el agua.

La semana siguiente continuaron las ocho eras, pero el cielo permaneció nublado durante buena parte de los días y se volvió a realizar un solo riego diario. El viernes todavía quedaba una pequeña cantidad de agua en el tanque.',
   'expositivo', 'tanque-huerta', 2, 1),
  (22, 22, 'El generador de la celebración',
   'Para una actividad comunitaria se utilizó un generador eléctrico que normalmente funciona cerca de cuatro horas con el tanque de combustible lleno.

Durante el ensayo del viernes se conectaron las luces del escenario y dos parlantes. El generador funcionó las cuatro horas previstas y todavía conservaba una pequeña cantidad de combustible.

El sábado, durante la celebración, se utilizaron las mismas luces, cuatro parlantes y un congelador para mantener frías las bebidas. El tanque había sido llenado nuevamente antes de comenzar. Sin embargo, después de dos horas y cuarenta minutos el generador se detuvo porque se había agotado el combustible.

Algunas personas pensaron que el equipo estaba averiado. Un técnico revisó el tanque, las conexiones y el motor, pero no encontró fugas ni daños. A la mañana siguiente volvieron a llenar el tanque y realizaron otra prueba utilizando las luces y solamente dos parlantes, sin conectar el congelador. El generador volvió a funcionar casi cuatro horas.',
   'expositivo', 'generador', 2, 2),
  (23, 23, 'Dos caminos hacia la escuela',
   'El transporte escolar puede utilizar dos caminos para llegar desde un sector vecino hasta la institución. El camino de El Bajo es más corto y, cuando el terreno está seco, el recorrido tarda aproximadamente 24 minutos. El camino de La Loma es un poco más largo y suele tomar unos 30 minutos.

Un lunes ambos caminos estaban secos y el conductor utilizó El Bajo sin dificultades. Durante la noche llovió intensamente. El martes tomó nuevamente ese camino, pero tardó 42 minutos. Al llegar explicó que había tenido que avanzar lentamente en una depresión de terreno arcilloso donde se acumulaba agua. Dos motociclistas que habían pasado anteriormente también habían regresado por ese sector.

El miércoles no volvió a llover. Sin embargo, un tractor había transitado por El Bajo durante la tarde anterior y dejó huellas profundas en la zona todavía húmeda. Ese día el transporte tardó 38 minutos.

Posteriormente algunos habitantes colocaron grava en la depresión y limpiaron un pequeño canal lateral por donde podía salir el agua. El viernes cayó una lluvia ligera durante la madrugada. A pesar de ello, el transporte realizó el recorrido por El Bajo en 27 minutos.',
   'narrativo', 'dos-caminos', 2, 3),
  (24, 24, 'Las cajas de mangos',
   'Un grupo de familias quiso observar por qué algunos mangos almacenados maduraban más rápido que otros. Para hacerlo, seleccionaron frutas de la misma variedad, recogidas el mismo día y con un aspecto igualmente verde y firme.

Distribuyeron los mangos en tres cajas iguales dentro de un mismo cuarto. La caja A quedó junto a varios bananos maduros; la caja B, junto a unos plátanos todavía verdes; y la caja C permaneció alejada de otras frutas. Todas estuvieron en el mismo lugar durante dos días.

Después de 48 horas, los mangos de la caja A mostraban un color más amarillo y estaban más blandos. Los de las cajas B y C permanecían bastante parecidos entre sí.

La semana siguiente realizaron nuevamente la prueba con otros mangos de características semejantes. Esta vez reemplazaron los bananos maduros ubicados junto a la caja A por bananos verdes. Después de dos días, los mangos de las tres cajas presentaron un grado de maduración muy parecido.',
   'expositivo', 'mangos', 2, 4);

INSERT INTO questions
  (id, text_id, number, inference_type, stem, correct_option, is_scored, rationale,
   instrument_version, display_number)
VALUES
  (200, 25, 200, 'causal', '¿Por qué Camilo regresó a su casa?', 'B', 0,
   'Combina el cielo gris, el regreso y la salida posterior con sombrilla.', 2, 0),
  (201, 21, 201, 'causal', '¿Cuál es la explicación mejor sustentada para que el tanque quedara vacío el miércoles?', 'C', 1,
   'Las dos eras nuevas y el doble riego elevaron conjuntamente el consumo; la revisión descarta una fuga observable.', 2, 1),
  (202, 21, 202, 'causal', '¿Por qué el agua alcanzó hasta el viernes durante la semana siguiente, aunque continuaban las ocho eras?', 'B', 1,
   'El único cambio relevante fue volver a un riego diario bajo condiciones menos calurosas.', 2, 2),
  (203, 21, 203, 'predictiva', 'Si otra semana presenta condiciones similares a la primera, pero el lunes el tanque comienza solamente a la mitad de su capacidad, ¿qué resultado es más probable?', 'A', 1,
   'Con menor reserva inicial y el mismo patrón de alto consumo, el agotamiento debe ocurrir antes del miércoles.', 2, 3),
  (204, 21, 204, 'predictiva', 'Si el tanque está completamente lleno, permanecen las ocho eras y vuelve el tiempo caluroso, pero se realiza solamente un riego diario, ¿qué conclusión está mejor sustentada?', 'D', 1,
   'Reducir la frecuencia debe prolongar la duración, pero el texto no permite fijar un día exacto.', 2, 4),
  (205, 22, 205, 'causal', '¿Cuál es la explicación que mejor integra la información sobre la menor duración del combustible el sábado?', 'B', 1,
   'El tanque estaba lleno y no había daños; la diferencia fue una carga eléctrica mayor.', 2, 5),
  (206, 22, 206, 'causal', '¿Qué dato ofrece la evidencia más fuerte contra la idea de que el generador estaba averiado?', 'C', 1,
   'Sin reparación, reducir los aparatos devolvió al generador casi toda su duración habitual.', 2, 6),
  (207, 22, 207, 'predictiva', 'Para otra actividad se utilizará un tanque lleno, las mismas luces y cuatro parlantes, pero no se conectará el congelador. Según lo observado, ¿qué predicción es más razonable?', 'D', 1,
   'La carga queda entre las dos pruebas observadas, por lo que la duración esperada también debe ser intermedia.', 2, 7),
  (208, 22, 208, 'predictiva', 'Si en otra celebración se mantienen las luces, los cuatro parlantes y el congelador, pero además se conecta otro equipo eléctrico, ¿qué resultado sería más coherente con lo observado?', 'A', 1,
   'Una carga aún mayor es coherente con un consumo más rápido que el registrado el sábado.', 2, 8),
  (209, 23, 209, 'causal', '¿Por qué El Bajo dejó de ser la ruta más rápida después de la lluvia intensa del lunes?', 'C', 1,
   'La acumulación de agua en el terreno arcilloso obligó a reducir la velocidad y anuló la ventaja de distancia.', 2, 9),
  (210, 23, 210, 'causal', '¿Qué explica mejor que El Bajo siguiera siendo lento el miércoles aunque no hubiera vuelto a llover?', 'A', 1,
   'Persistía la humedad y el tractor añadió huellas profundas a la zona afectada.', 2, 10),
  (211, 23, 211, 'predictiva', 'Si ocurre una nueva lluvia de intensidad moderada, pero la grava y el canal continúan en buenas condiciones, ¿qué predicción está mejor sustentada?', 'B', 1,
   'La intervención redujo el retraso bajo lluvia ligera, aunque no garantiza el tiempo de terreno seco.', 2, 11),
  (212, 23, 212, 'predictiva', 'Si antes de una lluvia fuerte el canal lateral queda obstruido y vuelve a acumularse agua en la depresión, ¿qué resultado sería más coherente con los datos anteriores?', 'D', 1,
   'Restablecer la acumulación de agua recupera la condición asociada con los mayores retrasos.', 2, 12),
  (213, 24, 213, 'causal', '¿Cuál es la explicación mejor sustentada para la maduración más rápida de los mangos de la caja A durante la primera prueba?', 'A', 1,
   'Las frutas eran comparables y compartían el cuarto; la condición distintiva era la cercanía de bananos maduros.', 2, 13),
  (214, 24, 214, 'causal', '¿Por qué la segunda prueba fortalece la explicación relacionada con los bananos maduros?', 'C', 1,
   'Al retirar la condición diferenciadora desapareció también la diferencia de maduración.', 2, 14),
  (215, 24, 215, 'predictiva', 'Si en una nueva prueba se colocan bananos maduros junto a la caja C y se conservan iguales las demás condiciones, ¿qué resultado sería más coherente con las observaciones anteriores?', 'B', 1,
   'Trasladar la condición asociada con la aceleración permite esperar el efecto junto a la caja C.', 2, 15),
  (216, 24, 216, 'predictiva', 'En otra prueba, los bananos maduros permanecen junto a una caja solamente durante las primeras 24 horas y luego son retirados. ¿Qué predicción es la más prudente?', 'D', 1,
   'Una exposición parcial podría producir un efecto, pero probablemente menor que la exposición completa observada.', 2, 16);

INSERT INTO options (question_id, letter, content) VALUES
  (200, 'A', 'Porque había olvidado la maleta en la sala de su casa.'),
  (200, 'B', 'Porque vio que podía llover y fue a buscar una sombrilla.'),
  (200, 'C', 'Porque la esquina estaba cerrada ese día por reparaciones.'),
  (200, 'D', 'Porque decidió que ya no iba a salir a ninguna parte.'),
  (201, 'A', 'El calor ocasionó una pérdida de agua directamente desde las paredes del tanque.'),
  (201, 'B', 'Una fuga pequeña consumió agua aunque no dejó señales visibles alrededor del tanque.'),
  (201, 'C', 'Las nuevas eras y el doble riego aumentaron la cantidad total de agua utilizada.'),
  (201, 'D', 'La válvula permaneció abierta durante algunos momentos sin que los estudiantes lo notaran.'),
  (202, 'A', 'Las plantas nuevas dejaron de necesitar tanta agua después de su primera semana.'),
  (202, 'B', 'El menor riego y las condiciones menos calurosas redujeron el consumo de agua.'),
  (202, 'C', 'Los estudiantes probablemente utilizaron menos agua porque algunas plantas fueron retiradas.'),
  (202, 'D', 'El tanque almacenó una cantidad mayor aunque fue llenado de la manera acostumbrada.'),
  (203, 'A', 'El agua probablemente se agotará antes del miércoles si se mantienen los dos riegos diarios.'),
  (203, 'B', 'El agua probablemente alcanzará hasta el miércoles porque habrá las mismas ocho eras sembradas.'),
  (203, 'C', 'El agua probablemente llegará hasta el viernes porque el tanque no presenta ninguna fuga.'),
  (203, 'D', 'El agua probablemente durará más tiempo porque las plantas ya llevan varias semanas sembradas.'),
  (204, 'A', 'El agua alcanzará necesariamente hasta el viernes porque el tanque comienza completamente lleno.'),
  (204, 'B', 'El agua volverá a terminarse el miércoles porque continúan sembradas las ocho eras.'),
  (204, 'C', 'El agua se agotará antes porque un solo riego diario necesitará una cantidad mayor.'),
  (204, 'D', 'El agua debería durar más que con dos riegos, aunque no puede precisarse hasta qué día.'),
  (205, 'A', 'El motor presentó una falla temporal que desapareció antes de realizar la prueba del domingo.'),
  (205, 'B', 'La mayor cantidad de equipos conectados hizo que el generador consumiera combustible más rápidamente.'),
  (205, 'C', 'El tanque recibió menos combustible el sábado aunque se indicó que había sido llenado completamente.'),
  (205, 'D', 'El congelador ocasionó una pérdida de combustible dentro del generador durante la celebración.'),
  (206, 'A', 'El equipo había sido utilizado anteriormente durante otras actividades realizadas en la comunidad.'),
  (206, 'B', 'El técnico revisó diferentes componentes y decidió mantener funcionando el mismo generador posteriormente.'),
  (206, 'C', 'Sin realizar reparaciones, el equipo recuperó casi su duración habitual al reducir los aparatos conectados.'),
  (206, 'D', 'Durante el ensayo inicial todavía permanecía una pequeña cantidad de combustible dentro del tanque.'),
  (207, 'A', 'Funcionará exactamente cuatro horas porque el tanque tendrá la misma cantidad de combustible.'),
  (207, 'B', 'Funcionará solamente dos horas y cuarenta minutos porque se mantendrán los cuatro parlantes.'),
  (207, 'C', 'Funcionará menos que el sábado porque el congelador ayudaba a estabilizar el consumo eléctrico.'),
  (207, 'D', 'Probablemente durará más que el sábado, aunque podría no alcanzar la duración del primer ensayo.'),
  (208, 'A', 'El combustible podría agotarse antes de las dos horas y cuarenta minutos registradas anteriormente.'),
  (208, 'B', 'El combustible debería durar lo mismo porque la capacidad del tanque no habría cambiado.'),
  (208, 'C', 'El combustible podría durar cerca de cuatro horas porque el generador no presenta averías.'),
  (208, 'D', 'La duración no tendría ninguna relación con la cantidad de dispositivos conectados al generador.'),
  (209, 'A', 'El conductor probablemente redujo la velocidad porque desconocía los cambios realizados en el camino.'),
  (209, 'B', 'La distancia del recorrido aumentó debido a que las motocicletas bloquearon temporalmente el sector.'),
  (209, 'C', 'El agua acumulada en la zona arcillosa dificultó el paso y eliminó la ventaja de la ruta corta.'),
  (209, 'D', 'El camino de La Loma se hizo más corto debido a las condiciones provocadas por la lluvia.'),
  (210, 'A', 'El terreno continuaba afectado y las huellas del tractor aumentaron la dificultad para transitarlo.'),
  (210, 'B', 'El conductor decidió mantener una velocidad menor porque esperaba encontrar una nueva lluvia.'),
  (210, 'C', 'El agua acumulada aumentó durante el miércoles aunque no se registraron nuevas precipitaciones.'),
  (210, 'D', 'Las motocicletas habían deteriorado definitivamente todo el recorrido desde El Bajo hasta la institución.'),
  (211, 'A', 'El recorrido necesariamente volverá a durar 42 minutos porque El Bajo sigue siendo una zona arcillosa.'),
  (211, 'B', 'Podría tardar algo más que en seco, pero es probable que el retraso sea menor que antes.'),
  (211, 'C', 'El recorrido será más rápido que los 24 minutos habituales porque ahora existe un canal lateral.'),
  (211, 'D', 'La duración será idéntica a la de La Loma porque las dos rutas reaccionarán igual ante la lluvia.'),
  (212, 'A', 'La grava impedirá cualquier retraso aunque el agua permanezca acumulada en la zona baja.'),
  (212, 'B', 'El transporte mantendrá los 27 minutos porque el camino ya fue intervenido anteriormente.'),
  (212, 'C', 'La ruta de La Loma se volverá necesariamente más lenta debido a la obstrucción de El Bajo.'),
  (212, 'D', 'El tiempo de recorrido por El Bajo probablemente aumentará nuevamente respecto al recorrido normal.'),
  (213, 'A', 'La cercanía de los bananos maduros estuvo relacionada con el cambio más rápido de los mangos.'),
  (213, 'B', 'La caja A conservaba una temperatura diferente aunque todas permanecieron dentro del mismo cuarto.'),
  (213, 'C', 'Los mangos de la caja A probablemente estaban más maduros desde antes de iniciar la prueba.'),
  (213, 'D', 'La posición de la caja A dentro del cuarto aceleró por sí sola el proceso observado.'),
  (214, 'A', 'Porque muestra que cualquier tipo de banano puede acelerar del mismo modo la maduración.'),
  (214, 'B', 'Porque demuestra que los mangos necesitan permanecer exactamente dos días para poder madurar.'),
  (214, 'C', 'Porque al retirar la condición diferenciadora desapareció también la diferencia observada entre las cajas.'),
  (214, 'D', 'Porque confirma que la caja A siempre presenta mejores condiciones para almacenar frutas maduras.'),
  (215, 'A', 'Los mangos de las tres cajas madurarán exactamente igual porque pertenecen a la misma variedad.'),
  (215, 'B', 'Los mangos de la caja C probablemente madurarán más rápido que aquellos sin bananos maduros cerca.'),
  (215, 'C', 'Los mangos de la caja A seguirán madurando primero porque esa caja produjo el resultado inicial.'),
  (215, 'D', 'Los mangos cercanos a los plátanos verdes madurarán antes porque ya estuvieron sometidos a prueba.'),
  (216, 'A', 'Los mangos madurarán exactamente igual que cuando estuvieron acompañados durante las 48 horas completas.'),
  (216, 'B', 'Los mangos no mostrarán ningún cambio porque los bananos deben permanecer necesariamente dos días.'),
  (216, 'C', 'No puede esperarse ninguna diferencia porque la primera prueba no relacionó las frutas entre sí.'),
  (216, 'D', 'Podría existir cierta aceleración, aunque probablemente menor que con una exposición durante todo el periodo.');
