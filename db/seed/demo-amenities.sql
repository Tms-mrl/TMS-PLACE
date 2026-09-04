-- Baños + comodidades para las propiedades demo (para que las fichas se vean ricas).
UPDATE properties SET bathrooms=2, amenities='["wifi","gas","cochera","patio","parrilla"]' WHERE id=1;
UPDATE properties SET bathrooms=3, amenities='["wifi","gas","pileta","cochera","aire","seguridad"]' WHERE id=2;
UPDATE properties SET bathrooms=1, amenities='["wifi","gas","pileta","patio"]' WHERE id=3;
UPDATE properties SET bathrooms=1, amenities='["wifi","tv","aire","amoblado"]' WHERE id=4;
UPDATE properties SET bathrooms=1, amenities='["wifi","tv","aire","amoblado","seguridad"]' WHERE id=5;
UPDATE properties SET bathrooms=2, amenities='["wifi","gas","cochera","parrilla","patio"]' WHERE id=6;
UPDATE properties SET bathrooms=1, amenities='["seguridad","aire"]' WHERE id=7;
UPDATE properties SET bathrooms=1, amenities='["wifi","tv","amoblado"]' WHERE id=8;
UPDATE properties SET bathrooms=1, amenities='["wifi","tv","parrilla","gas","amoblado"]' WHERE title='Cabaña para 2 en Villa Carlos Paz';
UPDATE properties SET bathrooms=1, amenities='["wifi","tv","aire","amoblado"]' WHERE title='Depto para 2 en el centro';
UPDATE properties SET bathrooms=2, amenities='["wifi","tv","parrilla","pileta","patio","amoblado"]' WHERE title='Casa para 4 frente al lago';
