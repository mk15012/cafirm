-- Seed Subscription Plans
-- This migration ensures plans are always available in new database setups

INSERT INTO `Plan` (`code`, `name`, `description`, `monthlyPricePaise`, `yearlyPricePaise`, `maxClients`, `maxFirmsPerClient`, `maxUsers`, `maxStorageMB`, `maxCredentials`, `features`, `isActive`, `isPopular`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES 
  ('FREE', 'Starter', 'Perfect for individual CAs just getting started', 0, 0, 3, 2, 1, 100, 5, '{"taxCalculator":true,"approvalWorkflow":false,"activityLogs":false,"documentManagement":true,"invoiceManagement":true,"meetings":false,"customBranding":false,"apiAccess":false,"prioritySupport":false}', true, false, 0, NOW(), NOW()),
  ('BASIC', 'Basic', 'For small CA practices with growing client base', 49900, 499900, 25, 5, 3, 1024, 50, '{"taxCalculator":true,"approvalWorkflow":true,"activityLogs":false,"documentManagement":true,"invoiceManagement":true,"meetings":true,"customBranding":false,"apiAccess":false,"prioritySupport":false}', true, false, 1, NOW(), NOW()),
  ('PROFESSIONAL', 'Professional', 'For established CA firms with multiple team members', 99900, 999900, 100, 10, 10, 5120, 200, '{"taxCalculator":true,"approvalWorkflow":true,"activityLogs":true,"documentManagement":true,"invoiceManagement":true,"meetings":true,"customBranding":true,"apiAccess":false,"prioritySupport":true}', true, true, 2, NOW(), NOW()),
  ('ENTERPRISE', 'Enterprise', 'For large CA firms with unlimited needs', 249900, 2499900, -1, -1, -1, -1, -1, '{"taxCalculator":true,"approvalWorkflow":true,"activityLogs":true,"documentManagement":true,"invoiceManagement":true,"meetings":true,"customBranding":true,"apiAccess":true,"prioritySupport":true}', true, false, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `monthlyPricePaise` = VALUES(`monthlyPricePaise`),
  `yearlyPricePaise` = VALUES(`yearlyPricePaise`),
  `maxClients` = VALUES(`maxClients`),
  `maxFirmsPerClient` = VALUES(`maxFirmsPerClient`),
  `maxUsers` = VALUES(`maxUsers`),
  `maxStorageMB` = VALUES(`maxStorageMB`),
  `maxCredentials` = VALUES(`maxCredentials`),
  `features` = VALUES(`features`),
  `isActive` = VALUES(`isActive`),
  `isPopular` = VALUES(`isPopular`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW();

