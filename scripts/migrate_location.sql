-- Nora — Ritual: ceas circadian bazat pe locatie reala.
-- location_city/lat/lng: setare manuala de fallback (Me), folosita doar cand
-- userul refuza geolocation-ul din browser. Coordonatele GPS in sine NU se
-- salveaza niciodata aici - raman locale, doar pentru calculul de sunrise/sunset.
-- Ruleaza o singura data in Supabase -> SQL Editor.

alter table user_settings add column if not exists location_city text;
alter table user_settings add column if not exists location_lat numeric;
alter table user_settings add column if not exists location_lng numeric;
