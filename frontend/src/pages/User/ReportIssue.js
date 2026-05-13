import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  MapPin, 
  FileText, 
  CheckCircle2,
  Loader,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import EnhancedImageUpload from '../../components/UI/EnhancedImageUpload';
import MapComponent from '../../components/Map/MapComponent';
import useGeolocation from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../services/locationService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ISSUE_CATEGORIES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'street_light', label: 'Street Light' },
  { value: 'drainage', label: 'Drainage Problem' },
  { value: 'traffic_signal', label: 'Traffic Signal' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'sidewalk', label: 'Sidewalk Issue' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'garbage', label: 'Garbage/Litter' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'park_maintenance', label: 'Park Maintenance' },
  { value: 'noise_complaint', label: 'Noise Complaint' },
  { value: 'animal_issues', label: 'Animal Issues' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', description: 'Minor issues that can wait' },
  { value: 'medium', label: 'Medium Priority', description: 'Standard issues requiring attention' },
  { value: 'high', label: 'High Priority', description: 'Issues that need quick resolution' },
  { value: 'urgent', label: 'Urgent', description: 'Safety hazards requiring immediate attention' }
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [autoAddress, setAutoAddress] = useState(null);
  
  const { location, loading: locationLoading, error: locationError, getCurrentLocation: getLocation } = useGeolocation();

  // Enhanced getCurrentLocation with better user feedback
  const getCurrentLocation = async () => {
    try {
      toast.loading('Getting your location...', { id: 'location-loading' });
      await getLocation();
      toast.dismiss('location-loading');
    } catch (error) {
      toast.dismiss('location-loading');
      // Error handling is done in the useEffect above
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm({
    defaultValues: {
      category: '',
      priority: 'medium',
      title: '',
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });

  const watchedCategory = watch('category');

  // 🔥 Auto-fill Title based on category
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (watchedCategory) {
      const categoryLabel =
        ISSUE_CATEGORIES.find(c => c.value === watchedCategory)?.label || '';
      const currentTitle = watch('title');
      if (!currentTitle) {
        setValue('title', `${categoryLabel} Issue`, { shouldValidate: true });
      }
    }
  }, [watchedCategory, setValue, watch]);

  // Auto-fill location when GPS location is obtained
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (location) {
      setSelectedLocation({
        lat: location.lat,
        lng: location.lng
      });
      fetchAddressFromCoordinates(location.lat, location.lng);
      // Show success message
      toast.success('📍 Location detected successfully!');
    }
  }, [location]);

  // Handle location errors
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (locationError) {
      let errorMessage = 'Failed to get your location. ';
      
      switch (locationError.code) {
        case 1: // PERMISSION_DENIED
          errorMessage += 'Please allow location access in your browser settings.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage += 'Location information is unavailable.';
          break;
        case 3: // TIMEOUT
          errorMessage += 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage += 'Please try selecting location manually on the map.';
      }
      
      toast.error(errorMessage);
    }
  }, [locationError]);

  const fetchAddressFromCoordinates = useCallback(async (lat, lng) => {
    try {
      setAddressLoading(true);
      console.log('🌍 Fetching address for coordinates:', { lat, lng });
      
      const address = await reverseGeocode(lat, lng);
      setAutoAddress(address);
      
      console.log('📍 Received address data:', address);
      
      // Auto-fill form fields with enhanced validation
      setValue('address.street', address.street || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setValue('address.city', address.city || 'Unknown City');
      setValue('address.state', address.state || 'Unknown State');
      setValue('address.zipCode', address.zipCode || '00000');
      
      // Show appropriate success message
      if (address.isEstimated) {
        toast.success('📍 Location selected! Address estimated from coordinates.');
      } else {
        toast.success('📍 Address automatically detected!');
      }
      
      // Log the final form values for debugging
      console.log('✅ Form fields populated:', {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode
      });
      
    } catch (error) {
      console.error('❌ Error fetching address:', error);
      
      // Fallback: Set basic address info even if geocoding fails
      setValue('address.street', `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setValue('address.city', 'Unknown City');
      setValue('address.state', 'Unknown State');
      setValue('address.zipCode', '00000');
      
      toast.error('Could not detect address - using coordinates as fallback');
    } finally {
      setAddressLoading(false);
    }
  }, [setValue]);

  const handleLocationSelect = (coordinates) => {
    console.log('Location selected:', coordinates); // Debug log
    setSelectedLocation({
      lat: coordinates.lat,
      lng: coordinates.lng
    });
    fetchAddressFromCoordinates(coordinates.lat, coordinates.lng);
    toast.success('📍 Location selected on map!');
  };

  const handleStepValidation = async (step) => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await trigger(['category', 'title', 'description']);
        break;
      case 2:
        isValid = selectedLocation !== null;
        if (!isValid) {
          toast.error('Please select a location for the issue');
        }
        break;
      default:
        isValid = true;
        break;
    }
    
    if (isValid) {
      setCurrentStep(step + 1);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedLocation) {
      toast.error('Please select a location for the issue');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      
      const locationData = {
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat]
      };
      formData.append('location', JSON.stringify(locationData));
      
      const addressData = {
        street: data.address.street || '',
        city: data.address.city || '',
        state: data.address.state || '',
        zipCode: data.address.zipCode || '',
        formatted: autoAddress?.formatted || `${data.address.street || ''}, ${data.address.city || ''}, ${data.address.state || ''} ${data.address.zipCode || ''}`.trim()
      };
      formData.append('address', JSON.stringify(addressData));
      
      images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      const response = await api.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success) {
        toast.success('Issue reported successfully!');
        navigate('/my-issues');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const firstError = error.response.data.errors[0];
        toast.error(`Validation Error: ${firstError.message} (${firstError.field})`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit issue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Issue Details</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about the civic issue you'd like to report.</p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Issue Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ISSUE_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      watchedCategory === category.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value={category.value}
                      {...register('category', { required: 'Please select a category' })}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{category.label}</span>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
              )}
            </div>

            {/* Title */}
            <Input
              label="Issue Title"
              placeholder="Brief title describing the issue"
              required
              error={errors.title?.message}
              {...register('title', {
                required: 'Title is required',
                maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
              })}
            />

            {/* Images + Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photos (optional)</label>
              <EnhancedImageUpload
                onImagesChange={setImages}
                onAiDescription={(text) => {
                  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
                  if (!cleaned) return;

                  // Split into sentences
                  let sentences = cleaned
                    .split(/(?<=[.!?])\s+/)
                    .map(s => s.trim())
                    .filter(Boolean);

                  // Ensure we have at least 5 sentences by adding concise, relevant lines
                  const categoryLabel = ISSUE_CATEGORIES.find(c => c.value === watch('category'))?.label;
                  const priorityLabel = PRIORITY_LEVELS.find(p => p.value === watch('priority'))?.label;
                  const additions = [
                    categoryLabel ? `Category: ${categoryLabel}.` : 'Category selected for this issue.',
                    priorityLabel ? `Priority: ${priorityLabel}.` : 'This issue requires timely attention.',
                    'Please review the attached photos for additional context.',
                    'This condition may impact residents and public safety if left unresolved.',
                    'Prompt action is recommended to prevent further deterioration.'
                  ];
                  for (const line of additions) {
                    if (sentences.length >= 6) break;
                    if (!sentences.includes(line)) sentences.push(line);
                  }

                  // Keep to 5–6 lines and write one sentence per line
                  const finalText = sentences.slice(0, 6).join('\n');
                  setValue('description', finalText, { shouldValidate: true, shouldDirty: true });
                }}
                maxImages={5}
                maxSize={5 * 1024 * 1024}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                AI analysis will auto-fill the description below with a clear 5–6 line summary.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
              <textarea
                rows={6}
                placeholder="Provide detailed description of the issue... (AI will auto-fill from your photos)"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                {...register('description', {
                  required: 'Description is required',
                  maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Priority Level</label>
              <div className="space-y-2">
                {PRIORITY_LEVELS.map((priority) => (
                  <label
                    key={priority.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-500"
                      value={priority.value}
                      defaultChecked={priority.value === 'medium'}
                      {...register('priority')}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{priority.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{priority.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Location</h2>
              <p className="text-gray-600 dark:text-gray-400">Choose the location where the issue is located.</p>
            </div>

            {/* Prominent Current Location Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Use Your Current Location
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Let us automatically detect your location for accurate issue reporting.
                    <br />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      📱 Make sure location services are enabled in your browser
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  leftIcon={Navigation}
                  isLoading={locationLoading}
                  size="lg"
                  className={`w-full sm:w-auto px-8 py-3 text-lg font-semibold transition-all duration-300 ${
                    locationLoading 
                      ? 'animate-pulse bg-blue-600 hover:bg-blue-700' 
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <span className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Detecting Location...
                    </span>
                  ) : (
                    'Get My Current Location'
                  )}
                </Button>

                {selectedLocation && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-2"
                  >
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span className="font-medium">Location detected successfully!</span>
                    </div>
                    {location && location.accuracy && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📍 Accuracy: ±{Math.round(location.accuracy)}m
                      </p>
                    )}
                  </motion.div>
                )}

                {locationError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
                  >
                    <span className="text-sm">{locationError.message || 'Failed to get location'}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Alternative Option */}
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or select location manually
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Location Selection */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Select Location on Map
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🗺️ Click anywhere on the map to select the issue location. You can drag the marker to adjust.
                </p>
                {selectedLocation && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    ✅ Location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                )}
                
                {/* Debug: Test manual selection */}
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const testCoords = { lat: 40.7589, lng: -73.9851 }; // NYC coordinates
                      handleLocationSelect(testCoords);
                    }}
                  >
                    🧪 Test Manual Selection (NYC)
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <MapComponent
                  height="350px"
                  center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                  currentLocation={selectedLocation}
                  onLocationChange={handleLocationSelect}
                  clickable={true}
                  onMapClick={handleLocationSelect}
                  draggableMarker={true}
                  className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
                />
                
                {!selectedLocation && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg pointer-events-none">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center">
                      <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click on the map to select location
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address Details</h3>
                {addressLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader className="w-4 h-4 mr-1 animate-spin" /> Detecting address...
                  </div>
                )}
              </div>

              <Input label="Street Address" placeholder="Enter street address" {...register('address.street')} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="City" placeholder="City" {...register('address.city')} />
                <Input label="State" placeholder="State" {...register('address.state')} />
                <Input label="ZIP Code" placeholder="ZIP Code" {...register('address.zipCode')} />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Civic Issue</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Help improve your community by reporting infrastructure issues and public concerns.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Details & Images</span>
            <span>Location & Submit</span>
          </div>
        </motion.div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div>
                {currentStep < 2 ? (
                  <Button type="button" onClick={() => handleStepValidation(currentStep)}>Next</Button>
                ) : (
                  <Button type="submit" isLoading={isSubmitting} leftIcon={FileText}>Submit Report</Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;
