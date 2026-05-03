const db = require('../config/db');

exports.getContratistas = async(req, res) => {
   
    try{
        const [rows] = await db.query(
            `SELECT c.id, c.nombre, c.rut, c.correo_contacto, c.telefono, c.estado_id, e.nombre AS estado
            FROM contratista c
            INNER JOIN estado e ON c.estado_id = e.id
            ORDER BY c.nombre`
        );
        res.json(rows);
    } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearContratista = async (req, res) => {
  const { nombre, rut, correo_contacto, telefono } = req.body;

  if (!nombre?.trim() || !rut?.trim()) {
    return res.status(400).json({ error: 'Nombre y RUT son obligatorios' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO contratista (nombre, rut, correo_contacto, telefono, estado_id)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre.trim(), rut.trim(), correo_contacto?.trim() || null, telefono?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Contratista creado correctamente' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El RUT ya está registrado en el sistema' });
    }

    res.status(500).json({ error: error.message });
  }
};

exports.editarContratista = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo_contacto, telefono } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const [result] = await db.query(
      `UPDATE contratista
       SET nombre = ?, correo_contacto = ?, telefono = ?
       WHERE id = ?`,
      [nombre.trim(), correo_contacto?.trim() || null, telefono?.trim() || null, id]
    );

    if (result.affectedRows === 0){
      return res.status(404).json({ error: 'Error! Contratista no encontrado' });
    }
    res.json({ message: 'Contratista actualizado correctamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarContratista = async (req, res) => {
  const {id} = req.params;
  try {
    const [result] = await db.query(
      `UPDATE contratista SET estado_id = 2 WHERE id = ? AND estado_id = 1`,
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Error! Contratista no encontrado' });
    res.json({ message: 'Contratista desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarContratista = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `UPDATE contratista SET estado_id = 1 WHERE id = ? AND estado_id = 2`,
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Error! Contratista no encontrado' });
    res.json({ message: 'Contratista reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};