-- CoopenPlaces · 0012 · método de pago en gastos
-- Espeja receipts.method (efectivo|transferencia|otro) del lado de los egresos,
-- para poder desglosar el reporte de Finanzas por método de pago en ambos lados.

ALTER TABLE expenses ADD COLUMN method TEXT;
