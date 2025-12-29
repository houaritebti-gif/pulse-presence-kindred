-- Update the subscription_tier enum to replace 'basic' with 'plus'
ALTER TYPE subscription_tier RENAME VALUE 'basic' TO 'plus';