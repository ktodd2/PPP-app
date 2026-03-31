-- Update fuel surcharge default from 15% to 20%
UPDATE company_settings
SET default_fuel_surcharge = 20
WHERE default_fuel_surcharge = 15;

-- Update towing_services rates to match new code defaults
UPDATE towing_services SET rate = 5.5 WHERE name = 'Contained Recovery/Winching';
UPDATE towing_services SET rate = 6.5 WHERE name = 'Salvage/Debris Recovery';
UPDATE towing_services SET rate = 7.0 WHERE name = 'Handle Complete Recovery';
UPDATE towing_services SET rate = 3.5 WHERE name = 'Inclement Weather';
UPDATE towing_services SET rate = 3.5 WHERE name = 'Nights/Weekends/Holidays';
UPDATE towing_services SET rate = 4.5 WHERE name = 'Travel Within 50 Miles';
UPDATE towing_services SET rate = 7.5 WHERE name = 'Travel Beyond 50 Miles';
UPDATE towing_services SET rate = 3.0 WHERE name = 'Wheels Higher than Roof';
UPDATE towing_services SET rate = 3.0 WHERE name = 'Embankment or Inclines';
UPDATE towing_services SET rate = 3.0 WHERE name = 'Back Doors Open';
UPDATE towing_services SET rate = 3.0 WHERE name = 'Tractor from Under Trailer';
UPDATE towing_services SET rate = 7.0 WHERE name = 'Major Suspension Damage';
UPDATE towing_services SET rate = 3.0 WHERE name = '10 MPH Collision Factor';
UPDATE towing_services SET rate = 4.0 WHERE name = '30 MPH Collision Factor';
UPDATE towing_services SET rate = 5.0 WHERE name = '50 MPH Collision Factor';
UPDATE towing_services SET rate = 6.0 WHERE name = '70 MPH Collision Factor';
