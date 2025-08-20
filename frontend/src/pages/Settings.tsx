import React, { useState } from 'react';
import { Cog, Save, RotateCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

interface FormErrors {
  theme?: string;
  language?: string;
  timezone?: string;
  general?: string;
}

const Settings: React.FC = () => {
  const { settings, loading, updateSettings: updateSettingsContext, resetSettings: resetSettingsContext } = useSettings();
  const { t } = useLanguage();
  
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formSettings, setFormSettings] = useState(settings);

  // Common timezones for the dropdown
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'UTC', label: 'UTC' },
  ];

  // Update form settings when context settings change
  React.useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleInputChange = (field: keyof typeof settings, value: string) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear success message when user makes changes
    if (success) {
      setSuccess(false);
    }
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const hasChanges = () => {
    return (
      formSettings.theme !== settings.theme ||
      formSettings.language !== settings.language ||
      formSettings.timezone !== settings.timezone
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges()) {
      return;
    }
    
    try {
      setSaving(true);
      setErrors({});
      setSuccess(false);
      
      // Calculate the changes to send
      const changes: Partial<typeof settings> = {};
      if (formSettings.theme !== settings.theme) changes.theme = formSettings.theme;
      if (formSettings.language !== settings.language) changes.language = formSettings.language;
      if (formSettings.timezone !== settings.timezone) changes.timezone = formSettings.timezone;
      
      await updateSettingsContext(changes);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrors({ general: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setErrors({});
      setSuccess(false);
      
      await resetSettingsContext();
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setErrors({ general: 'Failed to reset settings. Please try again.' });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Cog className="h-8 w-8 mr-3 text-blue-600" />
            {t('settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Configure your task manager preferences.</p>
        </div>
        
        {/* Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-700">{t('settingsSaved')}</p>
                </div>
              </div>
            )}

            {/* Theme Setting */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('theme')}
              </label>
              <select
                id="theme"
                value={formSettings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="light">{t('light')}</option>
                <option value="dark">{t('dark')}</option>
                <option value="system">{t('system')}</option>
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme appearance</p>
            </div>

            {/* Language Setting */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('language')}
              </label>
              <select
                id="language"
                value={formSettings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">{t('english')}</option>
                <option value="zh">{t('chinese')}</option>
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select your preferred language</p>
            </div>

            {/* Timezone Setting */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('timezone')}
              </label>
              <select
                id="timezone"
                value={formSettings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose your timezone for accurate scheduling</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || saving}
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t('resetToDefaults')}
                  </>
                )}
              </button>
              
              <button
                type="submit"
                disabled={saving || resetting || !hasChanges()}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Current Values Display */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('currentSettings')}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>{t('theme')}:</strong> {formSettings.theme}</p>
            <p><strong>{t('language')}:</strong> {formSettings.language === 'en' ? t('english') : t('chinese')}</p>
            <p><strong>{t('timezone')}:</strong> {timezones.find(tz => tz.value === formSettings.timezone)?.label || formSettings.timezone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;