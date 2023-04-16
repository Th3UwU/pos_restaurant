psql postgres postgres
DROP DATABASE IF EXISTS REST;

CREATE DATABASE REST
	WITH ENCODING='UTF8';

exit
psql rest postgres

-- TABLA PROVEEDOR
CREATE TABLE PROVEEDOR
(
	-- PRIMARY KEY
	ID_PROVEEDOR INTEGER PRIMARY KEY,

	-- INFO
	NOMBRE TEXT NOT NULL,
	TELEFONO BIGINT NOT NULL,
	DIRECCION TEXT NOT NULL,
	ESTATUS BOOLEAN DEFAULT TRUE
);

-- EXAMPLES
INSERT INTO PROVEEDOR VALUES(0, 'DEFAULT', 0, 'DEFAULT', DEFAULT);
INSERT INTO PROVEEDOR VALUES(1, 'Lala', 0, 'DEFAULT', DEFAULT);
INSERT INTO PROVEEDOR VALUES(2, 'SuKarne', 0, 'DEFAULT', DEFAULT);
INSERT INTO PROVEEDOR VALUES(3, 'Abarrores', 0, 'DEFAULT', DEFAULT);

-- TABLA INSUMO
CREATE TABLE INSUMO
(
	-- PRIMARY KEY
	ID_INSUMO INTEGER PRIMARY KEY,

	-- INFO
	NOMBRE TEXT NOT NULL,
	DESCRIPCION TEXT NOT NULL,
	EXISTENCIAS INTEGER NOT NULL ,
	FECHA_CADUCIDAD DATE NOT NULL,
	ESTATUS BOOLEAN DEFAULT TRUE
);

-- EXAMPLES
INSERT INTO INSUMO VALUES(0, 'DEFAULT', 'DEFAULT', 0, '1999-01-29', DEFAULT);

-- TABLA PLATILLO
CREATE TABLE PLATILLO
(
	-- PRIMARY KEY
	ID_PLATILLO INTEGER PRIMARY KEY,
	
	-- INFO
	NOMBRE TEXT NOT NULL,
	PRECIO REAL NOT NULL,
	DESCRIPCION TEXT NOT NULL,
	IMAGEN BYTEA DEFAULT NULL,
	TIEMPO_PREPARACION INTEGER NOT NULL,
	CATEGORIA TEXT NOT NULL,
	ESTATUS BOOLEAN DEFAULT TRUE

);

-- EXAMPLES
INSERT INTO PLATILLO VALUES(0, 'DEFAULT', 0.0, 'DEFAULT', DEFAULT, 0, 'DEFAULT', DEFAULT);
INSERT INTO PLATILLO VALUES(1, 'maruchan', 30.0, 'DEFAULT', DEFAULT, 0, 'DEFAULT', DEFAULT);
INSERT INTO PLATILLO VALUES(2, 'pizza', 25.0, 'DEFAULT', DEFAULT, 0, 'DEFAULT', DEFAULT);
INSERT INTO PLATILLO VALUES(3, 'soda', 15.0, 'DEFAULT', DEFAULT, 0, 'DEFAULT', DEFAULT);

-- TABLA PLATILLO
CREATE TABLE INSUMO_PLATILLO
(
	-- PRIMARY KEY
	ID_INSUMO_PLATILLO INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_PLATILLO INTEGER REFERENCES PLATILLO (ID_PLATILLO),
	FK_INSUMO INTEGER REFERENCES INSUMO (ID_INSUMO),
	
	-- INFO
	CANTIDAD INTEGER NOT NULL CHECK(CANTIDAD > 0)
);

-- EXAMPLES
INSERT INTO INSUMO_PLATILLO VALUES(0, 0, 0, 0);

-- TABLA EMPLEADO
CREATE TABLE EMPLEADO
(
	-- PRIMARY KEY
	ID_EMPLEADO INTEGER PRIMARY KEY,

	-- INFO
	NOMBRE TEXT NOT NULL,
	CONTRASENA TEXT NOT NULL,
	TELEFONO BIGINT NOT NULL,
	PUESTO TEXT NOT NULL,
	SUELDO INTEGER NOT NULL,
	TELEFONO_EMERGENCIA BIGINT NOT NULL,
	ESTATUS BOOLEAN DEFAULT TRUE
);

-- EXAMPLES
INSERT INTO EMPLEADO VALUES(0, 'DEFAULT', 'DEFAULT', 0, 'DEFAULT', 0, 0, DEFAULT);
INSERT INTO EMPLEADO VALUES(1, 'Angel', 'DEFAULT', 0, 'repartidor', 0, 0, DEFAULT);
INSERT INTO EMPLEADO VALUES(2, 'Juan', 'DEFAULT', 0, 'repartidor', 0, 0, DEFAULT);
INSERT INTO EMPLEADO VALUES(3, 'Alan', 'DEFAULT', 0, 'gerente', 0, 0, DEFAULT);

-- TABLA INSUMO_PROVEEDOR
CREATE TABLE INSUMO_PROVEEDOR
(
	-- PRIMARY KEY
	ID_INSUMO_PROVEEDOR INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_PROVEEDOR INTEGER REFERENCES PROVEEDOR (ID_PROVEEDOR),
	FK_INSUMO INTEGER REFERENCES INSUMO (ID_INSUMO)
);

-- EXAMPLES
INSERT INTO INSUMO_PROVEEDOR VALUES(0, 0, 0);

-- TABLA COMANDA
CREATE TABLE COMANDA
(
	-- PRIMARY KEY
	ID_COMANDA INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_EMPLEADO INTEGER REFERENCES EMPLEADO (ID_EMPLEADO),

	-- INFO
	NOMBRE_CLIENTE TEXT NOT NULL,
	LOCAL INTEGER NOT NULL,
	PLAZA TEXT NOT NULL,
	PISO TEXT NOT NULL,
	PASILLO TEXT NOT NULL,
	HORA_ENTREGA TIME WITHOUT TIME ZONE NOT NULL,
	FECHA DATE NOT NULL,
	ESTATUS CHAR DEFAULT 'p'
	-- p: pendiente, e: entregado, g: pagado
);

-- EXAMPLES
INSERT INTO COMANDA VALUES(0, 0, 'DEFAULT', 0, 'DEFAULT', 'DEFAULT', 'DEFAULT', '00:00', '1999-01-29', DEFAULT);
INSERT INTO COMANDA VALUES(1, 0, 'Ximena', 32, 'DEFAULT', 'DEFAULT', 'DEFAULT', '00:00', '1999-01-29', DEFAULT);
INSERT INTO COMANDA VALUES(2, 1, 'Carlos', 43, 'DEFAULT', 'DEFAULT', 'DEFAULT', '00:00', '1999-01-29', 'e');

-- TABLA PLATILLO_COMANDA
CREATE TABLE PLATILLO_COMANDA
(
	-- PRIMARY KEY
	ID_PLATILLO_COMANDA INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_PLATILLO INTEGER REFERENCES PLATILLO (ID_PLATILLO),
	FK_COMANDA INTEGER REFERENCES COMANDA (ID_COMANDA),

	-- INFO
	CANTIDAD INTEGER NOT NULL CHECK (CANTIDAD > 0),
	COSTO REAL NOT NULL CHECK (COSTO >= 0.0)
);

-- EXAMPLES
INSERT INTO PLATILLO_COMANDA VALUES(0, 0, 0, 1, 0.0);

INSERT INTO PLATILLO_COMANDA VALUES(1, 1, 2, 2, (SELECT PRECIO FROM PLATILLO WHERE ID_PLATILLO = 1));
INSERT INTO PLATILLO_COMANDA VALUES(2, 2, 2, 4, (SELECT PRECIO FROM PLATILLO WHERE ID_PLATILLO = 2));
INSERT INTO PLATILLO_COMANDA VALUES(3, 3, 2, 7, (SELECT PRECIO FROM PLATILLO WHERE ID_PLATILLO = 3));
