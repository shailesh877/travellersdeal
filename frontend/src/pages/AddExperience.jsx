import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import { FaInfoCircle, FaChevronDown, FaCheckCircle, FaChevronUp, FaSearch, FaTimes, FaMapMarkerAlt, FaCloudUploadAlt, FaTrash, FaImage, FaCheck, FaArrowLeft, FaPen, FaLanguage, FaFileUpload, FaBars } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const LocationPicker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position ? <Marker position={position} /> : null;
};

const AutoSearchLocation = ({ searchTitle }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (searchTitle && searchTitle.trim().length > 2) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTitle)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
                    }
                })
                .catch(err => console.error("Geocoding failed", err));
        }
    }, [searchTitle, map]);
    return null;
};

const LANGUAGES = [
    "Abkhazian", "Afar", "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Aymara", "Azerbaijani",
    "Bashkir", "Basque", "Bengali", "Bhutani", "Bihari", "Bislama", "Breton", "Bulgarian", "Burmese", "Byelorussian",
    "Cambodian", "Catalan", "Chinese", "Corsican", "Croatian", "Czech", "Danish", "Dutch", "English", "Esperanto",
    "Estonian", "Faeroese", "Fiji", "Finnish", "French", "Frisian", "Galician", "Georgian", "German", "Greek",
    "Greenlandic", "Guarani", "Gujarati", "Hausa", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian",
    "Interlingua", "Interlingue", "Inupiak", "Inuktitut (Eskimo)", "Irish", "Italian", "Japanese", "Javanese",
    "Kannada", "Kashmiri", "Kazakh", "Kinyarwanda", "Kirghiz", "Kirundi", "Korean", "Kurdish", "Laothian", "Latin",
    "Latvian, Lettish", "Lingala", "Lithuanian", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori",
    "Marathi", "Moldavian", "Mongolian", "Nauru", "Nepali", "Norwegian", "Occitan", "Oriya", "Pashto, Pushto",
    "Persian", "Polish", "Portuguese", "Punjabi", "Quechua", "Rhaeto-Romance", "Romanian", "Russian", "Samoan",
    "Sangro", "Sanskrit", "Scots Gaelic", "Serbian", "Serbo-Croatian", "Sesotho", "Setswana", "Shona", "Sindhi",
    "Sinhala", "Siswati", "Slovak", "Slovenian", "Somali", "Spanish", "Sudanese", "Swahili", "Swedish", "Tagalog",
    "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tibetan", "Tigrinya", "Tonga", "Tsonga", "Turkish", "Turkmen",
    "Twi", "Uigur", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Volapuk", "Welsh", "Wolof", "Xhosa",
    "Yiddish (former ji)", "Yoruba", "Zhuang", "Zulu", "Bosnian", "Traditional Chinese"
];

const AddExperience = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // If editing from URL
    const { user } = useContext(AuthContext);

    // GetYourGuide wizard states
    const [creationStep, setCreationStep] = useState(1);
    const [subStep, setSubStep] = useState('title'); // 'title', 'description', 'locations'
    const [showTip, setShowTip] = useState(true);
    const [showDietaryRestrictions, setShowDietaryRestrictions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [experienceId, setExperienceId] = useState(id || null);
    const [locationInput, setLocationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [apiSuggestions, setApiSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [keywordSearchInput, setKeywordSearchInput] = useState('');
    const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
    const [activeMapStopIndex, setActiveMapStopIndex] = useState(null);
    const [inclusionsSubStep, setInclusionsSubStep] = useState('what-included');
    const [transportSearch, setTransportSearch] = useState('');
    const [transportSuggestions, setTransportSuggestions] = useState([]);
    const [suitabilitySearch, setSuitabilitySearch] = useState('');
    const [suitabilitySuggestions, setSuitabilitySuggestions] = useState([]);
    const [allowedSearch, setAllowedSearch] = useState('');
    const [allowedSuggestions, setAllowedSuggestions] = useState([]);
    const [mandatorySearch, setMandatorySearch] = useState('');
    const [mandatorySuggestions, setMandatorySuggestions] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const uploadedHashesRef = useRef(new Set());
    const [showExamples, setShowExamples] = useState(false);
    const [isAddingOption, setIsAddingOption] = useState(false);
    const [editingOptionIndex, setEditingOptionIndex] = useState(null);
    const [optionSubStep, setOptionSubStep] = useState('setup');
    const [languageSearch, setLanguageSearch] = useState('');
    const [audioSearch, setAudioSearch] = useState('');
    const [bookletSearch, setBookletSearch] = useState('');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showAudioDropdown, setShowAudioDropdown] = useState(false);
    const [showBookletDropdown, setShowBookletDropdown] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressModalType, setAddressModalType] = useState('meeting');
    const [pricingFlowStep, setPricingFlowStep] = useState('setup');
    const [showAdvancedPricingOptions, setShowAdvancedPricingOptions] = useState(false);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [tempAddressInput, setTempAddressInput] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [mainInfoOpen, setMainInfoOpen] = useState(true);
    const [inclusionsOpen, setInclusionsOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [globalCurrencies, setGlobalCurrencies] = useState(['USD', 'EUR', 'GBP', 'AED', 'INR', 'AUD', 'CAD']);

    useEffect(() => {
        axios.get(`${API_URL}/admin/settings`)
            .then(res => {
                if (res.data?.allowedCurrencies?.length > 0) {
                    setGlobalCurrencies(res.data.allowedCurrencies);
                }
            })
            .catch(err => console.error('Failed to fetch settings:', err));
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (['title', 'description'].includes(subStep)) {
            setMainInfoOpen(true);
        }
        if (subStep === 'inclusions') {
            setInclusionsOpen(true);
        }
    }, [subStep]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [creationStep, inclusionsSubStep, optionSubStep, pricingFlowStep]);

    const languageDropdownRef = useRef(null);
    const audioDropdownRef = useRef(null);
    const bookletDropdownRef = useRef(null);
    const categoryMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setShowLanguageDropdown(false);
            }
            if (audioDropdownRef.current && !audioDropdownRef.current.contains(event.target)) {
                setShowAudioDropdown(false);
            }
            if (bookletDropdownRef.current && !bookletDropdownRef.current.contains(event.target)) {
                setShowBookletDropdown(false);
            }
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
                setShowCategoryMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const [tempOption, setTempOption] = useState({
        title: '',
        description: '',
        currency: 'USD',
        durationSelection: 'duration',
        durationValue: 1,
        durationUnit: 'hours',
        validityValue: 1,
        audioGuideLanguages: [],
        bookletLanguages: [],
        hasGuideMaterials: false,
        hasAudioGuide: false,
        hasBooklets: false,
        capacity: 20,
        timeSlots: [],
        languages: [],
        privateGroup: false,
        referenceCode: 'default',
        skipLine: false,
        skipLineType: '',
        wheelchairAccessible: false,
        // Meeting & Pickup fields
        meetingType: 'meeting',
        meetingAddress: '',
        meetingDescription: '',
        meetingImages: [],
        arrivalTime: '',
        dropOffType: 'same',
        dropOffAddress: '',
        pickupType: 'any',
        pickupTimeType: 'before',
        pickupConfirmationType: 'day_before',
        pickupTimeSlots: '',
        pickupDescription: '',
        transportationType: '',
        // Connectivity
        useReservationSystem: undefined,
        reservationSystem: '',
        externalProductId: '',
        // Pricing
        pricingType: 'person',
        pricingPersonDependency: 'category',
        pricingTiers: [],
        addons: []
    });

    // State retained from the original huge file so we can migrate step by step
    const [formData, setFormData] = useState({
        language: '',
        primaryLanguage: '',
        title: '',
        referenceCode: '',
        shortDescription: '',
        description: '',
        category: '',
        pricingCategories: [],
        currency: 'USD',
        duration: '',
        location: { city: '', country: '', coordinates: { lat: 25.2048, lng: 55.2708 } },
        locations: [], // Array for multi-location support
        keywords: [], // Array for keyword tags
        exclusions: [], // Array for what's not included
        includesRaw: '', // Single string for textarea
        exclusionsRaw: '', // Single string for textarea
        isFoodIncluded: true,
        meals: [{ type: '', format: '', isDrinksIncluded: false, dietaryOptions: [], showDietary: false }],
        isTransportationUsed: false,
        transports: [],
        isDifferentCityTravel: false,
        images: [],
        guideType: 'tour-guide',
        highlights: ['', '', ''],
        itinerary: [],
        itineraryMap: '',
        includes: [],
        meetingPoint: '',
        whatToBring: [],
        notSuitableFor: [],
        notAllowed: [],
        petFriendly: false,
        petPolicy: '',
        mandatoryItems: [],
        knowBeforeYouGo: '',
        emergencyContact: { countryCode: '+91', number: '' },
        voucherInfo: '',
        languages: [],
        timeSlots: [],
        capacity: 20,
        privateGroup: false,
        dietaryOptions: [],
        copyrightConfirmed: false,
        bookingOptions: []
    });

    // Fetch existing data for Edit/Resume
    useEffect(() => {
        const fetchExperience = async () => {
            if (id) {
                try {
                    setLoading(true);
                    const config = {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    };
                    const { data } = await axios.get(`${API_URL}/experiences/${id}`, config);

                    setFormData({
                        language: data.primaryLanguage || '',
                        primaryLanguage: data.primaryLanguage || '',
                        title: data.title || '',
                        referenceCode: data.referenceCode || '',
                        shortDescription: data.shortDescription || '',
                        description: data.description || '',
                        category: data.category || '',
                        pricingCategories: data.pricingCategories || [],
                        currency: data.currency || 'USD',
                        duration: data.duration || '',
                        location: data.location || { city: '', country: '', coordinates: { lat: 25.2048, lng: 55.2708 } },
                        locations: data.locations || [],
                        keywords: data.keywords || [],
                        exclusions: data.exclusions || [],
                        exclusionsRaw: data.exclusions?.join('\n') || '',
                        includes: data.includes || [],
                        includesRaw: data.includes?.join('\n') || '',
                        isFoodIncluded: data.isFoodIncluded !== undefined ? data.isFoodIncluded : true,
                        guideType: data.guideType || 'tour-guide',
                        meals: data.meals?.length > 0 ? data.meals.map(m => ({
                            ...m,
                            isDrinksIncluded: m.isDrinksIncluded || false,
                            dietaryOptions: m.dietaryOptions || [],
                            showDietary: false
                        })) : [{ type: '', format: '', isDrinksIncluded: false, dietaryOptions: [], showDietary: false }],
                        isTransportationUsed: data.isTransportationUsed || false,
                        transports: data.transports || [],
                        isDifferentCityTravel: data.isDifferentCityTravel || false,
                        images: data.images || [],
                        highlights: data.highlights && data.highlights.length > 0
                            ? (data.highlights.length === 3 ? data.highlights : [...data.highlights, '', '', ''].slice(0, 3))
                            : ['', '', ''],
                        itinerary: data.itinerary || [],
                        itineraryMap: data.itineraryMap || '',
                        meetingPoint: data.meetingPoint || '',
                        whatToBring: data.whatToBring || [],
                        notSuitableFor: data.notSuitableFor || [],
                        notAllowed: data.notAllowed || [],
                        petFriendly: data.petFriendly || false,
                        petPolicy: data.petPolicy || '',
                        mandatoryItems: data.extraInformation?.whatToBring || data.mandatoryItems || data.whatToBring || [],
                        knowBeforeYouGo: Array.isArray(data.knowBeforeYouGo) ? data.knowBeforeYouGo.join('\n') : (data.knowBeforeYouGo || ''),
                        emergencyContact: data.emergencyContact || { countryCode: '+91', number: '' },
                        voucherInfo: data.voucherInfo || '',
                        languages: data.languages || [],
                        timeSlots: data.timeSlots || [],
                        capacity: data.capacity || 20,
                        privateGroup: data.privateGroup || false,
                        dietaryOptions: data.dietaryOptions || [],
                        copyrightConfirmed: data.copyrightConfirmed || false,
                        bookingOptions: (data.bookingOptions || []).map(opt => {
                            if (opt.optionSetup) {
                                return {
                                    ...opt,
                                    title: opt.optionSetup.title,
                                    referenceCode: opt.optionSetup.referenceCode,
                                    description: opt.optionSetup.description,
                                    maxGroupSize: opt.optionSetup.maxGroupSize,
                                    languages: opt.optionSetup.languages,
                                    audioGuideLanguages: opt.optionSetup.audioGuide?.languages || [],
                                    bookletLanguages: opt.optionSetup.informationBooklets?.languages || [],
                                    hasAudioGuide: opt.optionSetup.audioGuide?.hasAudioGuide || false,
                                    hasBooklets: opt.optionSetup.informationBooklets?.hasBooklets || false,
                                    privateGroup: opt.optionSetup.isPrivateActivity || false,
                                    skipLine: opt.optionSetup.skipTheLine?.isSkip || false,
                                    skipLineType: opt.optionSetup.skipTheLine?.lineDetails || '',
                                    wheelchairAccessible: opt.optionSetup.wheelchairAccessible || false,
                                    durationSelection: opt.optionSetup.durationOrValidity?.type || 'duration',
                                    durationValue: opt.optionSetup.durationOrValidity?.type === 'duration' ? parseInt(opt.optionSetup.durationOrValidity?.value) || 1 : 1,
                                    durationUnit: opt.optionSetup.durationOrValidity?.type === 'duration' ? (opt.optionSetup.durationOrValidity?.value?.replace(/[0-9]/g, '').trim() || 'hours') : 'hours',
                                    validityValue: opt.optionSetup.durationOrValidity?.type === 'validity' ? parseInt(opt.optionSetup.durationOrValidity?.value) || 1 : 1,
                                    validityUnit: opt.optionSetup.durationOrValidity?.type === 'validity' ? (opt.optionSetup.durationOrValidity?.value?.replace(/[0-9]/g, '').trim() || 'days') : 'days',
                                    meetingType: opt.meetingPointOrPickup?.meetingType || 'meeting',
                                    meetingAddress: opt.meetingPointOrPickup?.meetingAddress || '',
                                    meetingDescription: opt.meetingPointOrPickup?.meetingDescription || '',
                                    meetingImages: opt.meetingPointOrPickup?.meetingImages || [],
                                    arrivalTime: opt.meetingPointOrPickup?.arrivalTime || '',
                                    dropOffType: opt.meetingPointOrPickup?.dropOffType || 'same',
                                    dropOffAddress: opt.meetingPointOrPickup?.dropOffAddress || '',
                                    pickupType: opt.meetingPointOrPickup?.pickupType || 'any',
                                    pickupTimeType: opt.meetingPointOrPickup?.pickupTimeType || 'before',
                                    pickupConfirmationType: opt.meetingPointOrPickup?.pickupConfirmationType || 'day_before',
                                    pickupTimeSlots: opt.meetingPointOrPickup?.pickupTimeSlots || '',
                                    pickupDescription: opt.meetingPointOrPickup?.pickupDescription || '',
                                    transportationType: opt.meetingPointOrPickup?.transportationType || '',
                                    useReservationSystem: opt.connectivitySettings?.useReservationSystem || false,
                                    reservationSystem: opt.connectivitySettings?.reservationSystem || '',
                                    externalProductId: opt.connectivitySettings?.externalProductId || '',
                                    capacity: opt.availabilityAndPricing?.capacity || 20,
                                    pricingType: opt.availabilityAndPricing?.pricingType || 'person',
                                    pricingPersonDependency: opt.availabilityAndPricing?.pricingPersonDependency || 'everyone',
                                    price: opt.availabilityAndPricing?.price || '',
                                    pricingTiers: opt.availabilityAndPricing?.pricingTiers || [],
                                    addons: opt.availabilityAndPricing?.addons || [],
                                    currency: opt.availabilityAndPricing?.currency || 'USD',
                                    cutoffHours: opt.cutOff?.cutoffHours || 24,
                                    cancellationPolicy: opt.cutOff?.cancellationPolicy || 'free_24h'
                                };
                            }
                            return opt; // legacy flat fallback
                        })
                    });

                    if (data.bookingOptions && data.bookingOptions.length > 0) {
                        setCreationStep(3);
                        setSubStep('itinerary');
                    } else if (data.images && data.images.length > 0) {
                        setCreationStep(3);
                        setSubStep('options');
                    } else if (data.voucherInfo) {
                        setCreationStep(3);
                        setSubStep('photos');
                    } else if (data.includes && data.includes.length > 0) {
                        setCreationStep(3);
                        setSubStep('extra-info');
                    } else if (data.keywords && data.keywords.length > 0) {
                        setCreationStep(3);
                        setSubStep('inclusions');
                    } else if (data.locations && data.locations.length > 0) {
                        setCreationStep(3);
                        setSubStep('locations');
                    } else if (data.title && data.shortDescription) {
                        setCreationStep(3);
                        setSubStep('description');
                    } else if (data.title) {
                        setCreationStep(3);
                        setSubStep('title');
                    } else if (data.category) {
                        setCreationStep(2);
                    }
                } catch (error) {
                    console.error('Error fetching experience:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchExperience();
    }, [id]);

    // Real-time Location Search (Nominatim API)
    useEffect(() => {
        const searchLocations = async () => {
            if (locationInput.trim().length < 3) {
                setApiSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                setIsSearching(true);
                setShowSuggestions(true);
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/search?q=${locationInput}&format=json&addressdetails=1&limit=6&countrycodes=in`
                );

                const suggestions = response.data.map(item => ({
                    display_name: item.display_name,
                    city: item.address.city || item.address.town || item.address.village || item.address.county || '',
                    state: item.address.state || '',
                    country: item.address.country || ''
                }));

                setApiSuggestions(suggestions);
            } catch (error) {
                console.error("Location search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchLocations, 500);
        return () => clearTimeout(timeoutId);
    }, [locationInput]);

    // Click outside to hide suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.location-search-container')) {
                setShowSuggestions(false);
            }
            if (!event.target.closest('.keyword-search-container')) {
                setShowKeywordSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'language') {
            setFormData(prev => ({ ...prev, language: value, primaryLanguage: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddItineraryStop = () => {
        setFormData(prev => ({
            ...prev,
            itinerary: [...(prev.itinerary || []), { title: '', description: '', location: null }]
        }));
    };

    const handleItineraryChange = (index, field, value) => {
        const newItinerary = [...(formData.itinerary || [])];
        newItinerary[index][field] = value;
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const handleRemoveItineraryStop = (index) => {
        const newItinerary = [...(formData.itinerary || [])];
        newItinerary.splice(index, 1);
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const handleHighlightChange = (index, value) => {
        const newHighlights = [...formData.highlights];
        newHighlights[index] = value;
        setFormData(prev => ({ ...prev, highlights: newHighlights }));
    };

    const addHighlight = () => {
        setFormData(prev => ({ ...prev, highlights: [...prev.highlights, ''] }));
    };

    const removeHighlight = (index) => {
        if (formData.highlights.length > 3) {
            const newHighlights = formData.highlights.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, highlights: newHighlights }));
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setPhotoError('');
        const newImages = [...formData.images];
        const currentBatchHashes = new Set();

        for (const file of files) {
            // 0. Compute SHA-256 binary hash of the image content
            let fileHash = null;
            try {
                const buffer = await file.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (err) {
                console.error('Crypto hash error:', err);
            }

            const fileSignature = `${file.name.toLowerCase()}_${file.size}`;

            // Check name match
            const isNameDuplicate = newImages.some(existing => {
                const existingName = existing.split('/').pop().toLowerCase();
                const currentName = file.name.toLowerCase();
                return existing === currentName || existingName === currentName || existingName.endsWith(`-${currentName}`);
            });

            // Check content match (SHA-256 hash or signature match)
            const isContentDuplicate =
                (fileHash && (uploadedHashesRef.current.has(fileHash) || currentBatchHashes.has(fileHash))) ||
                uploadedHashesRef.current.has(fileSignature) ||
                currentBatchHashes.has(fileSignature);

            if (isNameDuplicate || isContentDuplicate) {
                const errorMsg = `⚠️ Same image "${file.name}" cannot be uploaded. Duplicate photos are not allowed.`;
                setPhotoError(errorMsg);
                window.scrollTo({ top: 250, behavior: 'smooth' });
                continue;
            }

            // 1. Size Validation (7MB)
            if (file.size > 7 * 1024 * 1024) {
                setPhotoError(`⚠️ File "${file.name}" is too large (maximum allowed size is 7MB).`);
                continue;
            }

            // 2. Format Validation
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setPhotoError(`⚠️ File "${file.name}" has an invalid format. Only JPG, JPEG, PNG, and GIF are allowed.`);
                continue;
            }

            // 3. Dimension & Orientation Validation
            try {
                const isValid = await new Promise((resolve) => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        URL.revokeObjectURL(img.src);
                        const isLandscape = img.width > img.height;
                        const isWideEnough = img.width >= 1280;

                        if (!isWideEnough) {
                            setPhotoError(`⚠️ Error in "${file.name}": Image must be at least 1280 pixels wide.`);
                            resolve(false);
                        } else if (!isLandscape) {
                            setPhotoError(`⚠️ Error in "${file.name}": Portrait/Vertical photos are not allowed. Please use Landscape format.`);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    };
                    img.onerror = () => resolve(false);
                });

                if (!isValid) continue;

            } catch (err) {
                console.error('Image validation error:', err);
                continue;
            }

            // If all checks pass, upload to backend
            const uploadData = new FormData();
            uploadData.append('image', file);

            try {
                const config = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                };
                const { data } = await axios.post(`${API_URL}/upload`, uploadData, config);
                if (data.image) {
                    if (newImages.includes(data.image)) {
                        setPhotoError(`⚠️ Same image "${file.name}" cannot be uploaded.`);
                    } else {
                        newImages.push(data.image);
                        if (fileHash) {
                            uploadedHashesRef.current.add(fileHash);
                            currentBatchHashes.add(fileHash);
                        }
                        uploadedHashesRef.current.add(fileSignature);
                    }
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        if (e.target) {
            e.target.value = '';
        }

        setFormData(prev => ({ ...prev, images: newImages }));
        setUploading(false);
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Save current tempOption to DB (used by every wizard step)
    const saveOptionToDB = async (latestTempOption) => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };

            let finalPricingTiers = (latestTempOption.pricingTiers || []).map(t => ({ ...t, price: Number(t.price) || 0 }));
            if (latestTempOption.pricingPersonDependency === 'everyone') {
                finalPricingTiers = [{
                    title: 'Adult',
                    minAge: 0,
                    maxAge: 99,
                    price: Number(latestTempOption.price) || 0
                }];
            }

            const sanitizedOption = {
                ...latestTempOption,
                pricingTiers: finalPricingTiers,
                addons: latestTempOption.addons ? latestTempOption.addons.map(a => ({ ...a, price: Number(a.price) || 0 })) : [],
                meetingType: latestTempOption.meetingType || 'meeting',
                dropOffType: latestTempOption.dropOffType || 'same',
                pickupType: latestTempOption.pickupType || 'any',
                pricingType: latestTempOption.pricingType || 'person',
                pricingPersonDependency: latestTempOption.pricingPersonDependency || 'everyone',
                cancellationPolicy: latestTempOption.cancellationPolicy || 'free_24h',
                durationSelection: latestTempOption.durationSelection || 'duration',
                validityUnit: latestTempOption.validityUnit || 'days',
                durationUnit: latestTempOption.durationUnit || 'hours'
            };

            const newOptions = [...formData.bookingOptions];
            if (editingOptionIndex !== null && editingOptionIndex >= 0 && editingOptionIndex < newOptions.length) {
                newOptions[editingOptionIndex] = sanitizedOption;
            } else {
                const existingIdx = newOptions.findIndex(o => o === tempOption || (sanitizedOption._tempId && o._tempId === sanitizedOption._tempId));
                if (existingIdx !== -1) {
                    newOptions[existingIdx] = sanitizedOption;
                } else {
                    newOptions.push(sanitizedOption);
                }
            }

            setFormData(prev => ({ ...prev, bookingOptions: newOptions }));

            const payload = {
                bookingOptions: newOptions
            };

            if (experienceId) {
                await axios.put(`${API_URL}/experiences/${experienceId}`, payload, config);
            } else {
                const fullPayload = {
                    ...formData,
                    bookingOptions: newOptions,
                    primaryLanguage: formData.language,
                    capacity: Number(formData.capacity) || 20,
                    highlights: formData.highlights.filter(h => h.trim() !== ''),
                    includes: (formData.includesRaw || '').split('\n').filter(l => l.trim()),
                    exclusions: (formData.exclusionsRaw || '').split('\n').filter(l => l.trim())
                };
                const { data } = await axios.post(`${API_URL}/experiences`, fullPayload, config);
                setExperienceId(data._id);
                window.history.replaceState(null, '', `/vendor/edit/${data._id}`);
            }
            return true;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message || 'Unknown error';
            console.error('Error saving option to DB:', msg, error?.response?.data);
            alert(`Option save failed: ${msg}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOption = async (shouldClose = false) => {
        if (!tempOption.title) {
            alert("Please fill in the Option Title.");
            return;
        }

        let calculatedOptPrice = Number(tempOption.price) || 0;
        if (tempOption.pricingPersonDependency === 'category' && tempOption.pricingTiers && tempOption.pricingTiers.length > 0) {
            const tierPrices = tempOption.pricingTiers.map(t => Number(t.price)).filter(p => p > 0);
            if (tierPrices.length > 0) calculatedOptPrice = Math.min(...tierPrices);
        }

        let finalPricingTiers = (tempOption.pricingTiers || []).map(t => ({ ...t, price: Number(t.price) || 0 }));
        if (tempOption.pricingPersonDependency === 'everyone') {
            finalPricingTiers = [{
                title: 'Adult',
                minAge: 0,
                maxAge: 99,
                price: Number(calculatedOptPrice) || 0
            }];
        }

        const sanitizedTempOption = {
            ...tempOption,
            price: calculatedOptPrice,
            pricingTiers: finalPricingTiers,
            addons: tempOption.addons ? tempOption.addons.map(a => ({ ...a, price: Number(a.price) || 0 })) : [],
            meetingType: tempOption.meetingType || 'meeting',
            dropOffType: tempOption.dropOffType || 'same',
            pickupType: tempOption.pickupType || 'any',
            pricingType: tempOption.pricingType || 'person',
            pricingPersonDependency: tempOption.pricingPersonDependency || 'everyone',
            cancellationPolicy: tempOption.cancellationPolicy || 'free_24h',
            durationSelection: tempOption.durationSelection || 'duration',
            validityUnit: tempOption.validityUnit || 'days',
            durationUnit: tempOption.durationUnit || 'hours'
        };

        const newOptions = [...formData.bookingOptions];
        let targetIndex = editingOptionIndex;

        if (targetIndex !== null && targetIndex >= 0 && targetIndex < newOptions.length) {
            newOptions[targetIndex] = sanitizedTempOption;
        } else {
            const existingIdx = newOptions.findIndex(o =>
                (sanitizedTempOption._tempId && o._tempId === sanitizedTempOption._tempId) ||
                (o.title && o.title === sanitizedTempOption.title && o.referenceCode === sanitizedTempOption.referenceCode)
            );
            if (existingIdx !== -1) {
                targetIndex = existingIdx;
                newOptions[existingIdx] = sanitizedTempOption;
            } else {
                targetIndex = newOptions.length;
                newOptions.push(sanitizedTempOption);
            }
            setEditingOptionIndex(targetIndex);
        }

        setFormData(prev => ({ ...prev, bookingOptions: newOptions }));

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };
            const calculateMinPrices = (options) => {
                if (!options || options.length === 0) return {};
                let prices = {};
                options.forEach(opt => {
                    if (opt.pricingPersonDependency === 'category' && opt.pricingTiers && opt.pricingTiers.length > 0) {
                        opt.pricingTiers.forEach(t => {
                            const tPrice = Number(t.price);
                            if (tPrice > 0) {
                                const cat = t.title.charAt(0).toUpperCase() + t.title.slice(1).toLowerCase();
                                if (prices[cat] === undefined) prices[cat] = tPrice;
                                else prices[cat] = Math.min(prices[cat], tPrice);
                            }
                        });
                    } else if (Number(opt.price) > 0) {
                        const tPrice = Number(opt.price);
                        if (prices['Adult'] === undefined) prices['Adult'] = tPrice;
                        else prices['Adult'] = Math.min(prices['Adult'], tPrice);
                        if (prices['Child'] === undefined) prices['Child'] = tPrice;
                        else prices['Child'] = Math.min(prices['Child'], tPrice);
                    }
                });
                return prices;
            };

            const computedPrices = calculateMinPrices(newOptions);
            const dynamicPricingCategories = Object.keys(computedPrices).map(cat => ({
                category: cat,
                price: computedPrices[cat]
            }));
            const payloadPricingCategories = dynamicPricingCategories.length > 0
                ? dynamicPricingCategories
                : (formData.pricingCategories && formData.pricingCategories.length > 0 ? formData.pricingCategories : []);

            const payload = {
                bookingOptions: newOptions,
                pricingCategories: payloadPricingCategories
            };

            if (experienceId) {
                await axios.put(`${API_URL}/experiences/${experienceId}`, payload, config);
            } else {
                const fullPayload = {
                    ...formData,
                    // Fallback values so draft can be created even if main form is incomplete
                    title: formData.title || 'Draft',
                    category: formData.category || 'General',
                    bookingOptions: newOptions,
                    primaryLanguage: formData.language || 'English',
                    pricingCategories: payloadPricingCategories,
                    capacity: Number(formData.capacity) || 20,
                    highlights: (formData.highlights || []).filter(h => h.trim() !== ''),
                    includes: (formData.includesRaw || '').split('\n').filter(l => l.trim()),
                    exclusions: (formData.exclusionsRaw || '').split('\n').filter(l => l.trim())
                };
                const { data } = await axios.post(`${API_URL}/experiences`, fullPayload, config);
                setExperienceId(data._id);
                window.history.replaceState(null, '', `/vendor/edit/${data._id}`);
            }
        } catch (error) {
            const msg = error?.response?.data?.message || error.message || 'Unknown error';
            console.error('Error saving option to DB:', msg, error?.response?.data);
            alert(`Option save failed: ${msg}`);
            return;
        } finally {
            setLoading(false);
        }

        if (shouldClose) {
            setIsAddingOption(false);
            setEditingOptionIndex(null);
            setOptionSubStep('setup');
            setPricingFlowStep('setup');
            setTempOption({
                title: '',
                description: '',
                price: '',
                currency: 'USD',
                durationSelection: 'duration',
                durationValue: 1,
                durationUnit: 'hours',
                validityValue: 1,
                validityUnit: 'days',
                audioGuideLanguages: [],
                bookletLanguages: [],
                hasGuideMaterials: false,
                hasAudioGuide: false,
                hasBooklets: false,
                capacity: 20,
                timeSlots: [],
                languages: [],
                privateGroup: false,
                referenceCode: 'default',
                skipLine: false,
                skipLineType: '',
                wheelchairAccessible: false,
                meetingType: 'meeting',
                meetingAddress: '',
                meetingDescription: '',
                meetingImages: [],
                arrivalTime: '',
                dropOffType: 'same',
                dropOffAddress: '',
                pickupType: 'any',
                pickupTimeType: 'before',
                pickupConfirmationType: 'day_before',
                pickupTimeSlots: '',
                pickupDescription: '',
                transportationType: '',
                useReservationSystem: undefined,
                reservationSystem: '',
                externalProductId: '',
                pricingType: 'person',
                pricingPersonDependency: 'category',
                pricingTiers: [],
                addons: []
            });
        }
    };

    const editOption = (index) => {
        const optToEdit = { ...formData.bookingOptions[index] };
        if (optToEdit.pricingTiers && optToEdit.pricingTiers.length > 0) {
            const adultTier = optToEdit.pricingTiers.find(t => t.title.toLowerCase() === 'adult') || optToEdit.pricingTiers[0];
            optToEdit.price = adultTier.price;
        }
        setTempOption(optToEdit);
        setEditingOptionIndex(index);
        setIsAddingOption(true);
    };

    const toggleLocation = (loc) => {
        const cleanLoc = loc.split(',').slice(0, 3).join(',').trim();
        if (formData.locations.includes(cleanLoc)) {
            setFormData(prev => ({ ...prev, locations: prev.locations.filter(l => l !== cleanLoc) }));
        } else {
            setFormData(prev => ({ ...prev, locations: [...prev.locations, cleanLoc] }));
        }
    };

    const handleSaveProgress = async (exitAfterSave = false, customPayload = null) => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };

            const calculateMinPrices = (options) => {
                if (!options || options.length === 0) return {};
                let prices = {};
                options.forEach(opt => {
                    if (opt.pricingPersonDependency === 'category' && opt.pricingTiers && opt.pricingTiers.length > 0) {
                        opt.pricingTiers.forEach(t => {
                            const tPrice = Number(t.price);
                            if (tPrice > 0) {
                                const cat = t.title.charAt(0).toUpperCase() + t.title.slice(1).toLowerCase();
                                if (prices[cat] === undefined) prices[cat] = tPrice;
                                else prices[cat] = Math.min(prices[cat], tPrice);
                            }
                        });
                    } else if (Number(opt.price) > 0) {
                        const tPrice = Number(opt.price);
                        if (prices['Adult'] === undefined) prices['Adult'] = tPrice;
                        else prices['Adult'] = Math.min(prices['Adult'], tPrice);
                        if (prices['Child'] === undefined) prices['Child'] = tPrice;
                        else prices['Child'] = Math.min(prices['Child'], tPrice);
                    }
                });
                return prices;
            };

            const computedPrices = calculateMinPrices(formData.bookingOptions);
            const dynamicPricingCategories = Object.keys(computedPrices).map(cat => ({
                category: cat,
                price: computedPrices[cat]
            }));
            const payloadPricingCategories = dynamicPricingCategories.length > 0
                ? dynamicPricingCategories
                : (formData.pricingCategories && formData.pricingCategories.length > 0 ? formData.pricingCategories : []);

            const payload = customPayload || {
                ...formData,
                title: formData.title || 'Draft Experience',
                category: formData.category || 'General',
                primaryLanguage: formData.language,
                pricingCategories: payloadPricingCategories,
                capacity: Number(formData.capacity) || 20,
                highlights: (formData.highlights || []).filter(h => h.trim() !== ''),
                includes: (formData.includesRaw || '').split('\n').filter(l => l.trim()),
                exclusions: (formData.exclusionsRaw || '').split('\n').filter(l => l.trim())
            };

            if (experienceId) {
                await axios.put(`${API_URL}/experiences/${experienceId}`, payload, config);
            } else {
                const { data } = await axios.post(`${API_URL}/experiences`, payload, config);
                setExperienceId(data._id);
                window.history.replaceState(null, '', `/vendor/edit/${data._id}`);
            }

            if (exitAfterSave) {
                navigate('/vendor/dashboard');
            }
            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            alert('Failed to save progress. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallProgress = () => {
        let score = 0;
        const total = 10;

        if (formData.category) score++;
        if (formData.title && formData.title.length >= 10) score++;
        if (formData.shortDescription && formData.shortDescription.length >= 10 &&
            formData.description && formData.description.length >= 10) score++;
        if (formData.locations && formData.locations.length > 0) score++;
        if (formData.keywords && formData.keywords.length > 0) score++;
        if ((formData.includes && formData.includes.length > 0) || (formData.includesRaw && formData.includesRaw.trim().length > 5)) score++;
        if (formData.knowBeforeYouGo && formData.knowBeforeYouGo.trim().length > 5) score++;
        if (formData.images && formData.images.length >= 4 && formData.copyrightConfirmed) score++;

        const isOptionComplete = (opt) => {
            const isTitleDone = !!opt.title;
            const isMeetingDone = opt.meetingType === 'meeting' ? !!opt.meetingAddress : (opt.pickupType !== '' && opt.pickupType !== undefined);
            const isPricingDone = !!opt.price || (opt.pricingTiers && opt.pricingTiers.length > 0);
            return isTitleDone && isMeetingDone && isPricingDone;
        };

        if (formData.bookingOptions && formData.bookingOptions.length > 0 && formData.bookingOptions.every(isOptionComplete)) score++;
        if (formData.itinerary && formData.itinerary.length > 0) score++;

        return Math.round((score / total) * 100);
    };

    if (loading && !formData.title && !formData.category) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
                <div className="w-12 h-12 border-4 border-[#0071EB] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#1A2B49] font-bold text-lg tracking-tight">Loading your progress...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 selection:bg-blue-100">
            <header className="bg-white border-b border-gray-200 h-[70px] flex items-center justify-between px-8 sticky top-0 z-50">
                <Link to="/vendor/dashboard" className="text-2xl font-bold text-[#1A2B49] tracking-tighter hover:text-[#0071EB] transition-colors">Travellers Deal</Link>
                {creationStep >= 3 && (
                    <button
                        className="md:hidden text-[#1A2B49] p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    >
                        {isMobileSidebarOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                    </button>
                )}
            </header>

            {creationStep < 3 && (
                <main className="max-w-[760px] mx-auto mt-12 px-6 animation-fade-in pb-20">
                    <h1 className="text-[28px] font-bold text-[#1A2B49] mb-8 tracking-tight">Create a new product</h1>
                    <div className="bg-[#E6F0F9] rounded-lg p-4 flex items-start gap-3 mb-10 border border-blue-50">
                        <FaInfoCircle className="text-[#0071EB] text-xl shrink-0 mt-0.5" />
                        <p className="text-[#1A2B49] text-[15px] leading-relaxed font-medium">
                            We customize the product creation process based on what you choose here. Check that your answers are correct before continuing, as they can't be changed later.
                        </p>
                    </div>
                    <div className="relative border-l border-gray-200 ml-[15px] space-y-12 pb-12">
                        <div className="relative pl-10">
                            <div className={`absolute -left-[16px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${creationStep >= 1 ? 'bg-[#0071EB] text-white ring-8 ring-white shadow-sm' : 'bg-gray-50 text-gray-400 ring-8 ring-white border border-gray-200'}`}>1</div>
                            <div className="pt-1">
                                <h2 className={`text-lg font-bold cursor-pointer transition-colors ${creationStep === 1 ? 'text-[#0071EB]' : 'text-gray-500 hover:text-[#0071EB]'}`} onClick={() => setCreationStep(1)}>Product Language</h2>
                                {creationStep === 1 && (
                                    <div className="mt-6 animation-fade-in max-w-xl">
                                        <h3 className="text-base font-bold text-[#1A2B49] mb-2 tracking-tight">What language will you use to write your activity?</h3>
                                        <div className="relative">
                                            <select name="language" value={formData.language} onChange={handleChange} className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0071EB] focus:border-[#0071EB] outline-none appearance-none bg-white text-[#1A2B49] px-4 py-3.5 text-sm cursor-pointer font-medium shadow-sm">
                                                <option value="" disabled>Select a language</option>
                                                {['English', 'Hindi', 'French', 'Spanish', 'German', 'Italian', 'Chinese', 'Japanese'].map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500"><FaChevronDown size={14} /></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="relative pl-10">
                            <div className={`absolute -left-[16px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${creationStep >= 2 ? 'bg-[#0071EB] text-white ring-8 ring-white shadow-sm' : 'bg-gray-50 text-gray-400 ring-8 ring-white border border-gray-200'}`}>2</div>
                            <div className="pt-1">
                                <h2 className={`text-lg font-bold cursor-pointer transition-colors ${creationStep === 2 ? 'text-[#0071EB]' : (formData.language ? 'text-gray-500 hover:text-[#0071EB]' : 'text-gray-400 cursor-not-allowed')}`} onClick={() => { if (formData.language) setCreationStep(2); }}>Product Category</h2>
                                {creationStep === 2 && (
                                    <div className="mt-6 animation-fade-in max-w-3xl">
                                        <h3 className="text-base font-bold text-[#1A2B49] mb-2 tracking-tight">Which of these best describes your activity?</h3>
                                        <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden bg-white">
                                            {[
                                                { id: 'Entry ticket', desc: 'Entry to an attraction, landmark, theme park, show, or event' },
                                                { id: 'Tour', desc: 'Guided walking tours of a city or attraction, day trips, multi-day trips, city cruises, etc.' },
                                                { id: 'City card', desc: 'A pass for multiple attractions and/or transport within a city' },
                                                { id: 'Hop-on hop-off ticket', desc: 'Entry to a hop-on hop-off bus or boat' },
                                                { id: 'Transport experience', desc: 'Memorable ways to travel, e.g. scenic train, ferry, or cable car.' },
                                                { id: 'Rental experience', desc: 'Like traditional costumes, or renting a bicycle or vintage car.' },
                                                { id: 'Other', desc: 'Like a cooking class, creative workshop, or two attractions sold together.' }
                                            ].map((item, index, array) => (
                                                <label key={item.id} className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors ${index !== array.length - 1 ? 'border-b border-gray-100' : ''} ${formData.category === item.id ? 'bg-[#F0F7FF]' : ''}`}>
                                                    <div className="pt-0.5">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.category === item.id ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                            {formData.category === item.id && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                        </div>
                                                        <input type="radio" name="category" value={item.id} checked={formData.category === item.id} onChange={handleChange} className="hidden" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1A2B49] text-[13.5px] mb-1">{item.id}</div>
                                                        <div className="text-[13px] text-gray-500 leading-relaxed font-medium">{item.desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-12 w-full max-w-3xl pr-5">
                        <button onClick={() => { if (!formData.language || !formData.category) return; setCreationStep(3); subStep === 'title' && setSubStep('title'); window.scrollTo(0, 0); }} className={`px-7 py-2.5 rounded-full font-medium text-[13px] shadow-sm transition-all ${(formData.language && formData.category) ? 'bg-[#0071EB] text-white hover:bg-blue-700 hover:shadow-md' : 'bg-[#E6E6E6] text-[#A3A3A3] cursor-not-allowed'}`}>Continue</button>
                    </div>
                </main>
            )}

            {creationStep >= 3 && (
                <div className="flex-1 w-full mx-auto flex flex-col md:flex-row bg-white relative animation-fade-in z-0 min-h-[calc(100vh-70px)]">
                    {/* Left Sidebar Card Box */}
                    <div className={`w-full md:w-[290px] p-6 md:sticky md:top-[70px] max-h-[calc(100vh-70px)] overflow-y-auto z-40 bg-white shadow-xl md:shadow-none transition-all ${isMobileSidebarOpen ? 'fixed inset-0 top-[70px]' : 'hidden md:block'}`}>
                        {!isAddingOption ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                {/* Progress Bar Top */}
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="h-[6px] flex-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#00A651] transition-all duration-700 ease-in-out"
                                                style={{
                                                    width: `${calculateOverallProgress()}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-[13px] font-medium text-gray-500 shrink-0">
                                            {calculateOverallProgress()}%
                                        </span>
                                    </div>
                                </div>

                                {/* Navigation Items */}
                                <nav className="space-y-1" onClick={() => setIsMobileSidebarOpen(false)}>
                                    <div className="flex items-center justify-between px-3.5 py-2 text-[14px] font-medium text-[#1A2B49] rounded-xl">
                                        <span>Product category</span>
                                        <FaCheckCircle className="text-[#00A651] text-base" />
                                    </div>
                                    <div className="flex items-center justify-between px-3.5 py-2 text-[14px] font-medium text-[#1A2B49] rounded-xl">
                                        <span>AI content creator</span>
                                        <FaCheckCircle className="text-[#00A651] text-base" />
                                    </div>

                                    <div className="flex flex-col">
                                        <div
                                            className={`flex items-center justify-between px-3.5 py-2 text-[14px] font-medium rounded-xl cursor-pointer transition-colors ${['title', 'description'].includes(subStep) ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50'}`}
                                            onClick={() => {
                                                setMainInfoOpen(!mainInfoOpen);
                                                if (!mainInfoOpen && !['title', 'description'].includes(subStep)) {
                                                    setSubStep('title');
                                                }
                                            }}
                                        >
                                            <span>Main information</span>
                                            <FaChevronDown className={`text-xs text-gray-500 transition-transform ${mainInfoOpen ? '' : 'rotate-180'}`} />
                                        </div>
                                        {mainInfoOpen && (
                                            <div className="ml-3 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
                                                <div className={`px-3 py-1.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer ${subStep === 'title' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`} onClick={() => setSubStep('title')}>
                                                    <span>Title</span>
                                                    {formData.title.length >= 10 && <FaCheckCircle className="text-[#00A651] text-sm" />}
                                                </div>
                                                <div className={`px-3 py-1.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer ${subStep === 'description' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`} onClick={() => setSubStep('description')}>
                                                    <span>Descriptions & highlights</span>
                                                    {(formData.shortDescription?.trim().length >= 10 && formData.description?.trim().length >= 10 && (formData.highlights || []).filter(h => h.trim().length > 0).length >= 3) && <FaCheckCircle className="text-[#00A651] text-sm" />}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === 'locations' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                        onClick={() => setSubStep('locations')}
                                    >
                                        <span>Locations</span>
                                        {formData.locations.length > 0 && <FaCheckCircle className="text-[#00A651] text-base" />}
                                    </div>

                                    <div
                                        className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === 'keywords' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                        onClick={() => setSubStep('keywords')}
                                    >
                                        <span>Keywords</span>
                                        {formData.keywords.length > 0 && <FaCheckCircle className="text-[#00A651] text-base" />}
                                    </div>

                                    <div className="flex flex-col">
                                        <div
                                            className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === 'inclusions' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                            onClick={() => {
                                                setInclusionsOpen(!inclusionsOpen);
                                                if (!inclusionsOpen && subStep !== 'inclusions') {
                                                    setSubStep('inclusions');
                                                }
                                            }}
                                        >
                                            <span>Inclusions</span>
                                            <FaChevronDown className={`text-xs text-gray-500 transition-transform ${inclusionsOpen ? '' : 'rotate-180'}`} />
                                        </div>

                                        {inclusionsOpen && (
                                            <div className="ml-3 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
                                                {[
                                                    { label: "What's Included?", id: 'what-included', done: (formData.includesRaw || '').trim().length > 5 },
                                                    { label: "Guide information", id: 'guide', done: true },
                                                    { label: "Food", id: 'food', done: !formData.isFoodIncluded || (formData.meals || []).some(m => m.type !== '') },
                                                    { label: "Transportation", id: 'transport', done: formData.isTransportationUsed ? (formData.transports || []).length > 0 : true }
                                                ].map(item => (
                                                    <div
                                                        key={item.id}
                                                        className={`px-3 py-1.5 text-[12px] flex items-center justify-between rounded-lg cursor-pointer transition-colors ${inclusionsSubStep === item.id ? 'bg-[#F0F7FF] text-[#0071EB] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                                                        onClick={() => {
                                                            setSubStep('inclusions');
                                                            setInclusionsSubStep(item.id);
                                                        }}
                                                    >
                                                        <span>{item.label}</span>
                                                        {item.done && <FaCheckCircle className="text-[#00A651] text-xs" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {[{ label: 'Extra information', id: 'extra-info', done: formData.voucherInfo.length > 5 }, { label: 'Photos', id: 'photos', done: formData.images.length > 0 }, { label: 'Options', id: 'options', done: formData.bookingOptions.length > 0 && formData.bookingOptions.every(opt => !!opt.title && (opt.meetingType === 'meeting' ? !!opt.meetingAddress : (opt.pickupType !== '' && opt.pickupType !== undefined)) && (!!opt.price || (opt.pricingTiers && opt.pricingTiers.length > 0))) }].map(item => (
                                        <div
                                            key={item.id}
                                            className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === item.id ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                            onClick={() => setSubStep(item.id)}
                                        >
                                            <span>{item.label}</span>
                                            {item.done && <FaCheckCircle className="text-[#00A651] text-base" />}
                                        </div>
                                    ))}

                                    <div
                                        className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === 'itinerary' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                        onClick={() => setSubStep('itinerary')}
                                    >
                                        <span>Itinerary builder</span>
                                        {formData.itinerary && formData.itinerary.length > 0 && <FaCheckCircle className="text-[#00A651] text-base" />}
                                    </div>
                                    <div
                                        className={`px-3.5 py-2 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${subStep === 'verify' ? 'bg-[#E6F0F9] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                        onClick={() => setSubStep('verify')}
                                    >
                                        <span>Verify business details</span>
                                        {calculateOverallProgress() === 100 && <FaCheckCircle className="text-[#00A651] text-base" />}
                                    </div>
                                </nav>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                {/* Option Wizard Sidebar */}
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="h-[6px] flex-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#00A651] transition-all duration-700 ease-in-out"
                                                style={{
                                                    width: `${Math.round(([
                                                        !!tempOption.title,
                                                        tempOption.meetingType === 'meeting' ? !!tempOption.meetingAddress : (tempOption.pickupType !== '' && tempOption.pickupType !== undefined),
                                                        tempOption.useReservationSystem !== undefined && (tempOption.useReservationSystem === false || (tempOption.useReservationSystem === true && !!tempOption.reservationSystem && !!tempOption.externalProductId)),
                                                        !!tempOption.price || (tempOption.pricingTiers && tempOption.pricingTiers.length > 0),
                                                        true // cutoff defaults done
                                                    ].filter(Boolean).length / 5) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-500 shrink-0">
                                            {Math.round(([
                                                !!tempOption.title,
                                                tempOption.meetingType === 'meeting' ? !!tempOption.meetingAddress : (tempOption.pickupType !== '' && tempOption.pickupType !== undefined),
                                                tempOption.useReservationSystem !== undefined && (tempOption.useReservationSystem === false || (tempOption.useReservationSystem === true && !!tempOption.reservationSystem && !!tempOption.externalProductId)),
                                                !!tempOption.price || (tempOption.pricingTiers && tempOption.pricingTiers.length > 0),
                                                true
                                            ].filter(Boolean).length / 5) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setIsAddingOption(false); setOptionSubStep('setup'); }}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all font-bold text-[13px] rounded-full mt-2 mb-4"
                                >
                                    <FaArrowLeft size={10} /> Back to product
                                </button>

                                <nav className="space-y-1" onClick={() => setIsMobileSidebarOpen(false)}>
                                    {[
                                        { id: 'setup', label: 'Option setup', done: !!tempOption.title },
                                        { id: 'meeting', label: 'Meeting point or pickup', done: tempOption.meetingType === 'meeting' ? !!tempOption.meetingAddress : (tempOption.pickupType !== '' && tempOption.pickupType !== undefined) },
                                        { id: 'connectivity', label: 'Connectivity Settings', done: tempOption.useReservationSystem !== undefined && (tempOption.useReservationSystem === false || (tempOption.useReservationSystem === true && !!tempOption.reservationSystem && !!tempOption.externalProductId)) },
                                        { id: 'pricing', label: 'Availability & Pricing', done: !!tempOption.price || (tempOption.pricingTiers && tempOption.pricingTiers.length > 0) },
                                        { id: 'cutoff', label: 'Cut-off', done: true },
                                    ].map((step) => (
                                        <div
                                            key={step.id}
                                            onClick={() => setOptionSubStep(step.id)}
                                            className={`px-3.5 py-2.5 text-[14px] flex items-center justify-between rounded-xl cursor-pointer transition-colors ${optionSubStep === step.id ? 'bg-[#EBF5FF] text-[#0071EB] font-bold' : 'text-[#1A2B49] hover:bg-gray-50 font-medium'}`}
                                        >
                                            <span className="text-left">{step.label}</span>
                                            {step.done ? (
                                                <FaCheckCircle className="text-[#00A651] text-base shrink-0 ml-2" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0 ml-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </div>

                    {/* Main Form Content */}
                    <div className="flex-1 min-w-0 py-10 px-6 md:px-12 lg:px-20 max-w-5xl">

                        {subStep === 'title' && (
                            <div className="animate-fade-in relative pb-20">
                                <div className="max-w-[700px]">
                                    <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">What's the title that customers will see? <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                    <p className="text-[14px] text-[#1A2B49] mb-6 font-medium leading-relaxed">Provide a location followed by a colon (:), and include the activity type e.g. Tour or Entry Ticket.</p>
                                    <div className="mb-1">
                                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder={`Please insert your text in ${formData.language || 'English'}`} className="w-full border border-gray-300 rounded-[4px] px-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm focus:shadow-md" maxLength={60} />
                                        <div className="text-right text-[11px] text-gray-800 font-bold pt-1.5">{formData.title.length} / 60</div>
                                    </div>
                                    {showTip && <div className="bg-[#E6F0F9] rounded-[4px] p-4 flex items-start justify-between gap-3 mb-10 mt-2 border border-blue-100 shadow-sm"><div className="flex gap-3"><FaInfoCircle className="text-[#0071EB] mt-1 shrink-0" /><p className="text-[#1A2B49] text-[13.5px] font-medium leading-relaxed"><strong>Tip:</strong> Ensure there are no spelling or grammar mistakes.</p></div><button onClick={() => setShowTip(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button></div>}
                                    <div className="mt-12">
                                        <h2 className="text-[16px] font-bold text-[#1A2B49] mb-1 tracking-tight">Create a product reference code <span className="text-gray-500 font-medium">(optional)</span></h2>
                                        <input type="text" name="referenceCode" value={formData.referenceCode} onChange={handleChange} className="w-full border border-gray-300 rounded-[4px] px-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm" maxLength={20} />
                                        <div className="text-right text-[11px] text-gray-800 font-bold pt-1.5">{formData.referenceCode?.length || 0} / 20</div>
                                    </div>

                                </div>
                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button className={`w-full sm:w-auto text-center h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] whitespace-nowrap transition-all ${(formData.title.trim().length >= 10) ? 'bg-[#0071EB] text-white hover:bg-blue-700 shadow-md hover:px-8' : 'bg-[#E6E6E6] text-[#A3A3A3] cursor-not-allowed'}`} disabled={formData.title.trim().length < 10 || loading} onClick={async () => { const success = await handleSaveProgress(); if (success) setSubStep('description'); }}>{loading ? 'Saving...' : 'Continue'}</button>
                                </div>
                            </div>
                        )}

                        {subStep === 'description' && (
                            <div className="animate-fade-in relative pb-20">
                                <div className="max-w-[700px]">
                                    <div className="mb-12">
                                        <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Short description <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                        <p className="text-[14px] text-[#1A2B49] leading-[1.6] mb-6 font-medium">Give the customer a taste of what they'll do in 2 or 3 sentences.</p>
                                        <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder={`Please insert your text in ${formData.language || 'English'}`} className="w-full border border-gray-300 rounded-[4px] px-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[120px] resize-none transition-all shadow-sm focus:shadow-md" maxLength={200} />
                                        <div className="text-right text-[11px] text-gray-800 font-bold pt-1.5">{formData.shortDescription?.length || 0} / 200</div>
                                    </div>
                                    <div className="mb-12">
                                        <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Full description <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                        <p className="text-[14px] text-[#1A2B49] gap-2 mb-6 font-medium">Provide all the details about what the customer will see and experience during the activity.</p>
                                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder={`Please insert your text in ${formData.language || 'English'}`} className="w-full border border-gray-300 rounded-[4px] px-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[250px] resize-none transition-all shadow-sm focus:shadow-md" maxLength={3000} />
                                        <div className="text-right text-[11px] text-gray-800 font-bold pt-1.5">{formData.description?.length || 0} / 3000</div>
                                    </div>
                                    <div className="mb-20">
                                        <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Highlights <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                        <p className="text-[14px] text-[#1A2B49] mb-6 font-medium">Write 3-5 sentences explaining what makes your activity special.</p>
                                        <div className="bg-[#E6F0F9] rounded-[4px] p-4 flex items-start justify-between gap-3 mb-6 border border-blue-100 shadow-sm"><div className="flex gap-3"><FaInfoCircle className="text-[#0071EB] mt-1 shrink-0" /><p className="text-[#1A2B49] text-[13.5px] font-bold">3 Highlights are required</p></div><button className="text-gray-400 hover:text-gray-600">✕</button></div>
                                        <div className="space-y-4">
                                            {formData.highlights.map((highlight, index) => (
                                                <div key={index} className="relative">
                                                    <input type="text" value={highlight} onChange={(e) => handleHighlightChange(index, e.target.value)} placeholder={`Please insert your text in ${formData.language || 'English'}`} className="w-full border border-gray-300 rounded-[4px] px-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm" maxLength={150} />
                                                    <div className="text-right text-[11px] text-gray-800 font-bold pt-1.5">{highlight.length} / 150</div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={addHighlight} className="mt-6 flex items-center gap-2 text-[#0071EB] font-bold text-[15px] hover:text-[#0052CC] transition-all transform hover:translate-x-1"><span className="text-xl">+</span> Add another highlight</button>
                                    </div>
                                </div>
                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button className={`w-full sm:w-auto text-center h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] whitespace-nowrap transition-all ${(formData.shortDescription?.trim().length >= 10 && formData.description?.trim().length >= 10 && (formData.highlights || []).filter(h => h.trim().length > 0).length >= 3) ? 'bg-[#0071EB] text-white hover:bg-blue-700 shadow-md hover:px-8' : 'bg-[#E6E6E6] text-[#A3A3A3] cursor-not-allowed'}`} disabled={loading} onClick={async () => { if (!(formData.shortDescription?.trim().length >= 10 && formData.description?.trim().length >= 10 && (formData.highlights || []).filter(h => h.trim().length > 0).length >= 3)) return; const success = await handleSaveProgress(); if (success) setSubStep('locations'); }}>{loading ? 'Saving...' : 'Continue'}</button>
                                </div>
                            </div>
                        )}

                        {subStep === 'locations' && (
                            <div className="animate-fade-in relative pb-20">
                                <div className="max-w-[700px]">
                                    <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Where will customers visit? <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                    <p className="text-[14px] text-[#1A2B49] leading-[1.6] mb-8 font-medium">List all the major cities, sites, and attractions that your customers will visit during your experience. Add as many relevant locations as possible.</p>

                                    {/* Search Bar Container */}
                                    <div className="relative mb-6 location-search-container">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 z-10">
                                                <FaSearch size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search for cities (e.g. Kanpur, Delhi, Varanasi...)"
                                                value={locationInput}
                                                onChange={(e) => setLocationInput(e.target.value)}
                                                onFocus={() => locationInput.length >= 3 && setShowSuggestions(true)}
                                                className="w-full border border-gray-300 rounded-[4px] pl-11 pr-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm focus:shadow-md"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-4 inset-y-0 flex items-center">
                                                    <div className="w-4 h-4 border-2 border-[#0071EB] border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Suggestions Dropdown (API Powered) */}
                                        {showSuggestions && apiSuggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-[60] py-2 max-h-[350px] overflow-y-auto animate-fade-in custom-scrollbar">
                                                {apiSuggestions.map((suggestion, idx) => {
                                                    const cleanLoc = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
                                                    const isSelected = formData.locations.includes(cleanLoc);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleLocation(suggestion.display_name);
                                                            }}
                                                        >
                                                            <div className={`mt-0.5 w-[18px] h-[18px] border-2 rounded flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}>
                                                                {isSelected && <FaCheckCircle className="text-white text-[10px]" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-[14.5px] leading-tight ${isSelected ? 'text-[#0071EB] font-bold' : 'text-[#1A2B49] font-medium'}`}>
                                                                    {suggestion.city || suggestion.display_name.split(',')[0]}
                                                                </span>
                                                                <span className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                                                                    {suggestion.display_name.split(',').slice(1, 4).join(',').trim()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Fallback for no results */}
                                        {showSuggestions && apiSuggestions.length === 0 && !isSearching && locationInput.length >= 3 && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 p-4 text-center">
                                                <p className="text-gray-500 text-sm font-medium">No locations found for "{locationInput}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Locations Tags */}
                                    <div className="flex flex-wrap gap-3 mt-10 pb-32">
                                        {formData.locations.map((loc, idx) => (
                                            <div key={idx} className="bg-[#F0F2F5] hover:bg-gray-100 transition-all text-[#1A2B49] px-4 py-2.5 rounded-full flex items-center gap-2 text-[13.5px] font-bold border border-gray-200 shadow-sm animate-pop-in">
                                                <FaMapMarkerAlt className="text-[#0071EB] text-[12px]" />
                                                {loc}
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, locations: prev.locations.filter(l => l !== loc) }))}
                                                    className="text-gray-400 hover:text-red-500 transition-colors pt-0.5 ml-1"
                                                >
                                                    <FaTimes size={13} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.locations.length === 0 && (
                                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 w-full text-center">
                                                <div className="text-gray-400 font-medium italic text-sm">No locations added yet. Start by searching for a city in India.</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button
                                        className={`w-full sm:w-auto text-center h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] whitespace-nowrap transition-all ${formData.locations.length > 0 ? 'bg-[#0071EB] text-white hover:bg-blue-700 shadow-md hover:px-8' : 'bg-[#E6E6E6] text-[#A3A3A3] cursor-not-allowed'}`}
                                        disabled={loading || formData.locations.length === 0}
                                        onClick={async () => {
                                            const success = await handleSaveProgress();
                                            if (success) setSubStep('keywords');
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {subStep === 'keywords' && (
                            <div className="animate-fade-in relative pb-20">
                                <div className="max-w-[700px]">
                                    <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Add keywords to your product <span className="text-gray-500 font-medium">(optional)</span> <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>
                                    <p className="text-[14px] text-[#1A2B49] leading-[1.6] mb-8 font-medium">Keywords work as tags for your product and help customers find it when they search by a theme or their interests. Try to use all 15 for maximum reach.</p>

                                    <div className="relative mb-2 keyword-search-container">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 z-10">
                                                <FaSearch size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search keywords"
                                                className="w-full border border-gray-300 rounded-[4px] pl-11 pr-4 py-3 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm focus:shadow-md"
                                                value={keywordSearchInput}
                                                onChange={(e) => {
                                                    setKeywordSearchInput(e.target.value);
                                                    setShowKeywordSuggestions(true);
                                                }}
                                                onFocus={() => setShowKeywordSuggestions(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && keywordSearchInput.trim()) {
                                                        const kw = keywordSearchInput.trim();
                                                        if (!formData.keywords.includes(kw) && formData.keywords.length < 15) {
                                                            setFormData(p => ({ ...p, keywords: [...p.keywords, kw] }));
                                                            setKeywordSearchInput('');
                                                            setShowKeywordSuggestions(false);
                                                        }
                                                    }
                                                }}
                                            />
                                            {showKeywordSuggestions && keywordSearchInput.trim().length >= 1 && (
                                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-[60] py-2 max-h-[300px] overflow-y-auto animate-fade-in custom-scrollbar">
                                                    {[
                                                        'Walking tour', 'History', 'Adventure', 'Food & Drinks', 'Photography', 'Nightlife',
                                                        'Local lifestyle', 'Day trip', 'Hidden gems', 'Private tour', 'Small group',
                                                        'Architecture', 'Art', 'Shopping', 'Outdoors', 'Wildlife', 'Cruise', 'Relaxation'
                                                    ].filter(kw => kw.toLowerCase().includes(keywordSearchInput.toLowerCase()) && !formData.keywords.includes(kw)).map((kw, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[14px] font-medium text-[#1A2B49] transition-colors"
                                                            onClick={() => {
                                                                if (formData.keywords.length < 15) {
                                                                    setFormData(p => ({ ...p, keywords: [...p.keywords, kw] }));
                                                                    setKeywordSearchInput('');
                                                                    setShowKeywordSuggestions(false);
                                                                }
                                                            }}
                                                        >
                                                            {kw}
                                                        </div>
                                                    ))}
                                                    {![
                                                        'Walking tour', 'History', 'Adventure', 'Food & Drinks', 'Photography', 'Nightlife',
                                                        'Local lifestyle', 'Day trip', 'Hidden gems', 'Private tour', 'Small group',
                                                        'Architecture', 'Art', 'Shopping', 'Outdoors', 'Wildlife', 'Cruise', 'Relaxation'
                                                    ].some(kw => kw.toLowerCase().includes(keywordSearchInput.toLowerCase())) && (
                                                            <div className="px-4 py-2.5 text-gray-400 text-[13px] italic">Add "{keywordSearchInput}" as new keyword</div>
                                                        )}
                                                </div>
                                            )}
                                            <div className="absolute right-0 -bottom-6 text-[11px] text-gray-500 font-bold">
                                                {formData.keywords.length} / 15
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12">
                                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Suggestions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['Culture', 'Educational', 'Nature', 'Scenic', 'Spiritual', 'City Tour', 'Traditional', 'Local', 'Local culture', 'Authentic experience'].map(kw => {
                                                const isSelected = formData.keywords.includes(kw);
                                                return (
                                                    <button
                                                        key={kw}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setFormData(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }));
                                                            } else if (formData.keywords.length < 15) {
                                                                setFormData(p => ({ ...p, keywords: [...p.keywords, kw] }));
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-full border text-[13.5px] font-medium transition-all ${isSelected ? 'bg-blue-50 border-[#0071EB] text-[#0071EB] shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:border-[#0071EB] hover:text-[#0071EB]'}`}
                                                    >
                                                        {kw}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Selected Keywords summary */}
                                    <div className="mt-10 flex flex-wrap gap-2 pb-32">
                                        {formData.keywords.map(kw => (
                                            <div key={kw} className="bg-blue-50 text-[#0071EB] px-3 py-1.5 rounded-full flex items-center gap-2 text-[12px] font-bold border border-blue-100">
                                                {kw}
                                                <button onClick={() => setFormData(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }))} className="hover:text-red-500 transition-colors">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button
                                        className="h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] bg-[#0071EB] text-white hover:bg-blue-700 shadow-md sm:hover:px-8 transition-all whitespace-nowrap"
                                        onClick={async () => {
                                            const success = await handleSaveProgress();
                                            if (success) setSubStep('inclusions');
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {subStep === 'inclusions' && (
                            <div className="animate-fade-in relative pb-40">
                                <div className="max-w-[700px]">
                                    {/* Sub-sub-navigation Header (Mobile/Small screens) */}
                                    <div className="flex md:hidden overflow-x-auto gap-4 mb-6 pb-2 custom-scrollbar">
                                        {[
                                            { label: "What's Included?", id: 'what-included' },
                                            { label: "Guide information", id: 'guide' },
                                            { label: "Food", id: 'food' },
                                            { label: "Transportation", id: 'transport' }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                className={`whitespace-nowrap px-1 py-1 text-[13px] border-b-2 transition-all ${inclusionsSubStep === item.id ? 'border-[#0071EB] text-[#0071EB] font-bold' : 'border-transparent text-gray-500 font-medium'}`}
                                                onClick={() => setInclusionsSubStep(item.id)}
                                            >
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>

                                    {inclusionsSubStep === 'what-included' && (
                                        <>
                                            <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Inclusions & exclusions <span className="text-[10px] bg-[#E6F0F9] text-[#0071EB] px-2 py-0.5 rounded uppercase font-bold border border-blue-100 flex items-center gap-1"><FaInfoCircle size={10} /> Customizable</span></h1>

                                            <div className="mt-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-[15px] font-bold text-[#1A2B49]">What's included?</h3>
                                                    <div className="w-4 h-4 rounded-full border border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[10px] font-bold cursor-help">?</div>
                                                </div>
                                                <p className="text-[13px] text-gray-600 mb-4">List everything that's included in the price. Start a new line for each one. Ensure it's consistent with your descriptions and highlights.</p>
                                                <div className="relative">
                                                    <textarea
                                                        className="w-full h-[200px] border border-gray-300 rounded-[4px] p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm resize-none focus:shadow-md"
                                                        placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                        maxLength={1000}
                                                        value={formData.includesRaw}
                                                        onChange={(e) => setFormData(p => ({ ...p, includesRaw: e.target.value }))}
                                                    ></textarea>
                                                    <div className="absolute right-0 -bottom-6 text-[11px] text-gray-500 font-bold">
                                                        {formData.includesRaw.length} / 1000
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-14">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-[15px] font-bold text-[#1A2B49]">What's not included? <span className="text-gray-500 font-medium">(optional)</span></h3>
                                                    <div className="w-4 h-4 rounded-full border border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[10px] font-bold cursor-help">?</div>
                                                </div>
                                                <p className="text-[13px] text-gray-600 mb-4">Name any optional fees or charges that customers may encounter during the activity. This allows customers to know what to expect.</p>
                                                <div className="relative">
                                                    <textarea
                                                        className="w-full h-[200px] border border-gray-300 rounded-[4px] p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium transition-all shadow-sm resize-none focus:shadow-md"
                                                        placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                        maxLength={1000}
                                                        value={formData.exclusionsRaw}
                                                        onChange={(e) => setFormData(p => ({ ...p, exclusionsRaw: e.target.value }))}
                                                    ></textarea>
                                                    <div className="absolute right-0 -bottom-6 text-[11px] text-gray-500 font-bold">
                                                        {formData.exclusionsRaw.length} / 1000
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {inclusionsSubStep === 'guide' && (
                                        <div className="animate-fade-in">
                                            <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Who will guide the customers? <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>

                                            <div className="mt-8 space-y-1">
                                                {[
                                                    {
                                                        id: 'self-guided',
                                                        title: 'Self-Guided',
                                                        desc: 'The activity does not include a guide or similar; travellers will navigate the activity or attraction independently.'
                                                    },
                                                    {
                                                        id: 'tour-guide',
                                                        title: 'Tour guide',
                                                        badge: 'Customizable language',
                                                        desc: 'Leads a group of customers through a tour and explains things about the destination or attraction.'
                                                    },
                                                    {
                                                        id: 'host',
                                                        title: 'Host or greeter',
                                                        desc: 'Provides an introduction, purchases a ticket, or waits in line with customers, but doesn\'t provide a full tour of the attraction.'
                                                    },
                                                    {
                                                        id: 'instructor',
                                                        title: 'Instructor',
                                                        desc: 'Shows customers how to use equipment or teaches them how to do something.'
                                                    },
                                                    {
                                                        id: 'driver',
                                                        title: 'Driver',
                                                        desc: 'Drives the customer somewhere but doesn\'t explain anything along the way.'
                                                    }
                                                ].map((item) => (
                                                    <label key={item.id} className={`flex items-start gap-4 p-5 cursor-pointer rounded-lg hover:bg-gray-50 transition-all ${formData.guideType === item.id ? 'bg-[#F0F7FF]' : ''}`}>
                                                        <div className="pt-1.5">
                                                            <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${formData.guideType === item.id ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                {formData.guideType === item.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                name="guideType"
                                                                value={item.id}
                                                                checked={formData.guideType === item.id}
                                                                onChange={(e) => setFormData(p => ({ ...p, guideType: e.target.value }))}
                                                                className="hidden"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`font-bold text-[15px] ${formData.guideType === item.id ? 'text-[#0071EB]' : 'text-[#1A2B49]'}`}>{item.title}</div>
                                                                {item.badge && <span className="text-[10px] bg-white text-[#1A2B49] px-2 py-0.5 rounded border border-gray-200 font-bold flex items-center gap-1 uppercase tracking-tight"><FaInfoCircle size={10} className="text-[#0071EB]" /> {item.badge}</span>}
                                                            </div>
                                                            <div className="text-[13px] text-gray-500 leading-relaxed font-medium max-w-[550px]">{item.desc}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {inclusionsSubStep === 'food' && (
                                        <div className="animate-fade-in pb-10">
                                            <div className="flex items-center gap-2 mb-8">
                                                <h1 className="text-[21px] font-bold text-[#1A2B49] tracking-tight">Food & drinks</h1>
                                                <span className="text-[10px] bg-[#E6F0F9] text-[#0071EB] px-2 py-0.5 rounded border border-blue-100 font-bold flex items-center gap-1 uppercase tracking-tight"><FaInfoCircle size={10} /> Customizable</span>
                                            </div>

                                            <div className="mb-8">
                                                <h2 className="text-[16px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2">Is food included in your activity? <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h2>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'No', value: false },
                                                        { label: 'Yes', value: true }
                                                    ].map((option) => (
                                                        <label key={option.label} className="flex items-center gap-3 cursor-pointer group">
                                                            <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all ${formData.isFoodIncluded === option.value ? 'border-[#0071EB] bg-[#0071EB]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                {formData.isFoodIncluded === option.value && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                            </div>
                                                            <input type="radio" className="hidden" name="isFoodIncluded" checked={formData.isFoodIncluded === option.value} onChange={() => setFormData(p => ({ ...p, isFoodIncluded: option.value, ...(option.value === false ? { meals: [] } : {}) }))} />
                                                            <span className={`text-[15px] ${formData.isFoodIncluded === option.value ? 'font-bold text-[#1A2B49]' : 'font-medium text-gray-600'}`}>{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {formData.isFoodIncluded && (
                                                <div className="space-y-8 animate-fade-in">
                                                    <div className="space-y-4">
                                                        {(formData.meals && formData.meals.length > 0 ? formData.meals : [{ type: '', format: '', isDrinksIncluded: false, dietaryOptions: [], showDietary: false }]).map((meal, index) => (
                                                            <div key={index} className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm space-y-6 relative group">
                                                                <div className="flex flex-wrap items-end gap-4">
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <label className="block text-[13px] font-bold text-[#1A2B49] mb-1.5 transition-colors">Type of meal</label>
                                                                        <div className="relative">
                                                                            <select
                                                                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-[14px] outline-none focus:border-[#0071EB] transition-all bg-white font-medium appearance-none"
                                                                                value={meal.type}
                                                                                onChange={(e) => {
                                                                                    const newMeals = [...formData.meals];
                                                                                    newMeals[index].type = e.target.value;
                                                                                    setFormData(p => ({ ...p, meals: newMeals }));
                                                                                }}
                                                                            >
                                                                                <option value="">Please select</option>
                                                                                {['Full meal', 'Food tasting', 'Cooking class', 'Buffet', 'Snack', 'Picnic', 'Packed meal', 'Breakfast', 'Brunch', 'Lunch', 'Dinner'].map(m => <option key={m} value={m}>{m}</option>)}
                                                                            </select>
                                                                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <label className="block text-[13px] font-bold text-[#1A2B49] mb-1.5 transition-colors">Format</label>
                                                                        <div className="relative">
                                                                            <select
                                                                                className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-[14px] outline-none focus:border-[#0071EB] transition-all bg-white font-medium appearance-none"
                                                                                value={meal.format}
                                                                                onChange={(e) => {
                                                                                    const newMeals = [...formData.meals];
                                                                                    newMeals[index].format = e.target.value;
                                                                                    setFormData(p => ({ ...p, meals: newMeals }));
                                                                                }}
                                                                            >
                                                                                <option value="">Please select</option>
                                                                                {['Set menu', 'Buffet', 'À la carte', 'Picnic', 'Boxed', 'BBQ', 'Street food'].map(f => <option key={f} value={f}>{f}</option>)}
                                                                            </select>
                                                                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 ml-auto">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentMeals = formData.meals?.length > 0 ? formData.meals : [{ type: '', format: '', isDrinksIncluded: false, dietaryOptions: [], showDietary: false }];
                                                                                setFormData(p => ({ ...p, meals: [...currentMeals, { type: '', format: '', isDrinksIncluded: false, dietaryOptions: [], showDietary: false }] }));
                                                                            }}
                                                                            className="flex items-center gap-1.5 text-[#0071EB] text-[14px] font-bold py-2 hover:underline transition-all"
                                                                        >
                                                                            <div className="w-5 h-5 rounded-full border border-[#0071EB] flex items-center justify-center text-[13px] font-bold">+</div> Meal
                                                                        </button>
                                                                        {formData.meals.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = formData.meals.filter((_, i) => i !== index);
                                                                                    setFormData(p => ({ ...p, meals: next }));
                                                                                }}
                                                                                className="flex items-center gap-1.5 text-red-500 text-[14px] font-bold py-2 hover:underline transition-all"
                                                                            >
                                                                                <div className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center text-[13px] font-bold">−</div> Remove
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="pt-2">
                                                                    <label className="flex items-center gap-3 cursor-pointer group max-w-fit">
                                                                        <div className={`w-[20px] h-[20px] rounded-[4px] border-2 flex items-center justify-center transition-all ${meal.isDrinksIncluded ? 'border-[#0071EB] bg-[#0071EB]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                            {meal.isDrinksIncluded && <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 -translate-y-[1px]"></div>}
                                                                        </div>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="hidden"
                                                                            checked={meal.isDrinksIncluded}
                                                                            onChange={(e) => {
                                                                                const newMeals = [...formData.meals];
                                                                                newMeals[index].isDrinksIncluded = e.target.checked;
                                                                                setFormData(p => ({ ...p, meals: newMeals }));
                                                                            }}
                                                                        />
                                                                        <span className="text-[14px] font-bold text-[#1A2B49]">Drinks are included</span>
                                                                    </label>
                                                                </div>

                                                                <div className="border-t border-gray-100 pt-6">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-[14px] font-bold text-[#1A2B49]">Show dietary restrictions ({(meal.dietaryOptions || []).length})</div>
                                                                        <div
                                                                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${meal.showDietary ? 'bg-[#0071EB]' : 'bg-gray-200'}`}
                                                                            onClick={() => {
                                                                                const newMeals = [...formData.meals];
                                                                                newMeals[index].showDietary = !newMeals[index].showDietary;
                                                                                setFormData(p => ({ ...p, meals: newMeals }));
                                                                            }}
                                                                        >
                                                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${meal.showDietary ? 'right-1' : 'left-1'}`}></div>
                                                                        </div>
                                                                    </div>

                                                                    {meal.showDietary && (
                                                                        <div className="animate-fade-in mt-6 border-t border-dashed border-gray-100 pt-6">
                                                                            <h3 className="text-[15px] font-bold text-[#1A2B49] mb-1">Which dietary restrictions can you accommodate?</h3>
                                                                            <p className="text-[13px] text-gray-500 mb-6 font-medium">Please select all that are relevant for this meal</p>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-12">
                                                                                {[
                                                                                    'Diabetic', 'Egg-free', 'Gluten-free', 'Halal', 'Keto', 'Kosher',
                                                                                    'Lactose-free', 'Low-carb', 'Nut-free', 'Pescatarian', 'Seafood/fish-free', 'Vegan', 'Vegetarian'
                                                                                ].map(opt => (
                                                                                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                                                        <div className={`w-[20px] h-[20px] rounded-[4px] border-2 flex items-center justify-center transition-all ${(meal.dietaryOptions || []).includes(opt) ? 'border-[#0071EB] bg-[#0071EB]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                                            {(meal.dietaryOptions || []).includes(opt) && <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 -translate-y-[1px]"></div>}
                                                                                        </div>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="hidden"
                                                                                            checked={(meal.dietaryOptions || []).includes(opt)}
                                                                                            onChange={(e) => {
                                                                                                const currentOptions = meal.dietaryOptions || [];
                                                                                                const nextOptions = e.target.checked
                                                                                                    ? [...currentOptions, opt]
                                                                                                    : currentOptions.filter(x => x !== opt);
                                                                                                const updatedMeals = [...formData.meals];
                                                                                                updatedMeals[index].dietaryOptions = nextOptions;
                                                                                                setFormData(p => ({ ...p, meals: updatedMeals }));
                                                                                            }}
                                                                                        />
                                                                                        <span className={`text-[14px] ${(meal.dietaryOptions || []).includes(opt) ? 'font-bold text-[#1A2B49]' : 'font-medium text-gray-600'}`}>{opt}</span>
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {inclusionsSubStep === 'transport' && (
                                        <div className="space-y-12 animate-fade-in max-w-4xl">
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-[18px] font-bold text-[#1A2B49]">Is transportation used during this activity?</h2>
                                                        <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                                    </div>
                                                    <p className="text-[14px] text-gray-500 leading-relaxed max-w-2xl">
                                                        Provide the main transportation type(s) that customers use during the experience, like a Segway or bike. Transportation used for pickup and drop-off will be added later.
                                                    </p>
                                                    <div className="space-y-3 pt-2">
                                                        {[
                                                            { label: 'No', value: false },
                                                            { label: 'Yes', value: true }
                                                        ].map(option => (
                                                            <label key={option.label} className="flex items-center gap-3 cursor-pointer group w-fit">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isTransportationUsed === option.value ? 'border-[#0071EB]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                    {formData.isTransportationUsed === option.value && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                </div>
                                                                <input type="radio" className="hidden" name="isTransportationUsed" checked={formData.isTransportationUsed === option.value} onChange={() => setFormData(p => ({ ...p, isTransportationUsed: option.value, ...(option.value === false ? { transports: [] } : {}) }))} />
                                                                <span className={`text-[15px] ${formData.isTransportationUsed === option.value ? 'font-bold text-[#1A2B49]' : 'font-medium text-gray-600'}`}>{option.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {formData.isTransportationUsed && (
                                                    <div className="space-y-6 animate-slide-up bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                                        <div className="space-y-4">
                                                            <div className="relative group">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071EB] transition-colors">
                                                                    <FaSearch />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search for items"
                                                                    className="w-full bg-white border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-[15px] outline-none focus:border-[#0071EB] focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toLowerCase();
                                                                        const results = [
                                                                            'Bike', 'Segway', 'Electric bike', 'Mountain bike', 'Motorcycle', 'Scooter',
                                                                            'Car', 'Limousine', 'Jeep / SUV', 'Van', 'Bus / coach', 'Electric car',
                                                                            'Vintage car', 'Black cab', 'Sailboat', 'Ferry', 'Gondola', 'Duck boat',
                                                                            'Sightseeing cruise', 'Water taxi', 'Jetski', 'Riverboat', 'Kayak', 'Raft',
                                                                            'Catamaran', 'Speedboat', 'Yacht', 'Canoe', 'Paddleboard', 'Surfboard',
                                                                            'Submarine', 'Other water transport', 'Glass bottom boat', 'Lake cruise',
                                                                            'Banana boat', 'Beer boat', 'Airboat', 'Dhow', 'Train', 'Tram', 'Subway',
                                                                            'Helicopter', 'Airplane', 'Balloon', 'Glider', 'Public transportation',
                                                                            'Cable car', 'Quad ATV', 'Pedicab / rickshaw', 'Horse carriage', 'Camel',
                                                                            'Snowmobile', 'Sled', 'Other animal', 'Beer bike', 'Trike', 'Tuk tuk/auto',
                                                                            'Motorized tuk tuk/auto', 'Golf cart', 'On foot', 'Horse', 'Trolley'
                                                                        ].filter(item => item.toLowerCase().includes(val) && !formData.transports?.includes(item));
                                                                        setTransportSearch(val);
                                                                        setTransportSuggestions(val.length >= 1 ? results : []);
                                                                    }}
                                                                    value={transportSearch}
                                                                />
                                                                {transportSuggestions.length > 0 && (
                                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto py-2 animate-fade-in custom-scrollbar">
                                                                        {transportSuggestions.map(item => (
                                                                            <div
                                                                                key={item}
                                                                                onClick={() => {
                                                                                    setFormData(p => ({ ...p, transports: [...(p.transports || []), item] }));
                                                                                    setTransportSearch('');
                                                                                    setTransportSuggestions([]);
                                                                                }}
                                                                                className="px-5 py-2.5 hover:bg-blue-50 text-[15px] text-[#1A2B49] font-medium cursor-pointer transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-[#0071EB]"
                                                                            >
                                                                                {item}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {(formData.transports || []).map(item => (
                                                                    <div key={item} className="flex items-center gap-2 bg-[#E6F1FE] text-[#0071EB] px-4 py-2 rounded-full text-[14px] font-bold border border-[#CCE3FD] animate-fade-in group hover:bg-[#CCE3FD] transition-all cursor-default">
                                                                        {item}
                                                                        <FaTimes
                                                                            className="cursor-pointer hover:scale-125 transition-transform"
                                                                            onClick={() => setFormData(p => ({ ...p, transports: p.transports?.filter(x => x !== item) }))}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {formData.isTransportationUsed && (formData.transports || []).length > 0 && (
                                                    <div className="space-y-4 pt-4 animate-fade-in">
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-[17px] font-bold text-[#1A2B49]">Do customers travel to a different city/town during the activity?</h2>
                                                        </div>
                                                        <div className="space-y-6 pt-2">
                                                            {[
                                                                { label: 'Yes', value: true, desc: 'Example: going from Paris to Versailles' },
                                                                { label: 'No', value: false, desc: 'Example: going from one part of Paris to another part of Paris' }
                                                            ].map(option => (
                                                                <label key={option.label} className="flex flex-col gap-1 cursor-pointer group w-fit">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isDifferentCityTravel === option.value ? 'border-[#0071EB]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                            {formData.isDifferentCityTravel === option.value && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                        </div>
                                                                        <input type="radio" className="hidden" name="isDifferentCityTravel" checked={formData.isDifferentCityTravel === option.value} onChange={() => setFormData(p => ({ ...p, isDifferentCityTravel: option.value }))} />
                                                                        <span className={`text-[15px] ${formData.isDifferentCityTravel === option.value ? 'font-bold text-[#1A2B49]' : 'font-medium text-gray-600'}`}>{option.label}</span>
                                                                    </div>
                                                                    <p className="ml-8 text-[13px] text-gray-400 font-medium">{option.desc}</p>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button
                                        className="h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] bg-[#0071EB] text-white hover:bg-blue-700 shadow-md sm:hover:px-8 transition-all whitespace-nowrap"
                                        onClick={async () => {
                                            // Split text to arrays for storage
                                            const includesArray = formData.includesRaw.split('\n').filter(l => l.trim());
                                            const exclusionsArray = formData.exclusionsRaw.split('\n').filter(l => l.trim());

                                            const payload = {
                                                ...formData,
                                                includes: includesArray,
                                                exclusions: exclusionsArray
                                            };

                                            const success = await handleSaveProgress(false, payload);
                                            if (success) {
                                                if (inclusionsSubStep === 'what-included') setInclusionsSubStep('guide');
                                                else if (inclusionsSubStep === 'guide') setInclusionsSubStep('food');
                                                else if (inclusionsSubStep === 'food') setInclusionsSubStep('transport');
                                                else setSubStep('extra-info');
                                            }
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {subStep === 'extra-info' && (
                            <div className="animate-fade-in relative pb-40">
                                <div className="max-w-[700px] space-y-12">
                                    <h1 className="text-[21px] font-bold text-[#1A2B49] mb-4 tracking-tight">Extra information</h1>

                                    {/* Suitability */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">Who is this activity not suitable for? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                            <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                        </div>
                                        <p className="text-[13px] text-gray-500">Add the types of travelers who should not join this activity, like under 18s or pregnant women. This information appears on the activity details page.</p>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071EB]">
                                                <FaSearch size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search for items"
                                                className="w-full bg-white border border-gray-300 rounded-[4px] pl-11 pr-4 py-3 text-[15px] outline-none focus:border-[#0071EB] transition-all shadow-sm"
                                                value={suitabilitySearch}
                                                onChange={(e) => {
                                                    const val = e.target.value.toLowerCase();
                                                    const allSuitability = [
                                                        'People over 70 years', 'People over 95 years', 'People with altitude sickness', 'Babies under 1 year', 'Children under 10 years',
                                                        'Children under 11 years', 'Children under 12 years', 'Children under 13 years', 'Children under 14 years', 'Children under 15 years',
                                                        'Children under 16 years', 'Children under 18 years', 'Children under 2 years', 'Children under 3 years', 'Children under 4 years',
                                                        'Children under 5 years', 'Children under 6 years', 'Children under 7 years', 'Children under 8 years', 'Children under 3 ft (90 cm)',
                                                        'Children under 9 years', 'Cruise ship guests', 'People with diabetes', 'Divers without certification', 'People diving up to 24 hours prior',
                                                        'Drivers under 18 years', 'Drivers under 21 years', 'Drivers under 16 years', 'Hearing-impaired people', 'People with high blood pressure',
                                                        'People with lactose intolerance', 'People with low level of fitness', 'Non-swimmers', 'People with nut allergies', 'People over 287 lbs (130 kg)',
                                                        'People over 309 lbs (140 kg)', 'People over 209 lbs (95 kg)', 'People afraid of heights', 'People over 220 lbs (100 kg)', 'People over 243 lbs (110 kg)',
                                                        'People over 254 lbs (115 kg)', 'People over 260 lbs (118 kg)', 'People over 275 lbs (125 kg)', 'People over 297 lbs (135 kg)', 'People over 331 lbs (150 kg)',
                                                        'People over 5 ft 9 in (180 cm)', 'People over 6 ft 6 in (200 cm)', 'People over 200 lbs (91 kg)', 'People over 230 lbs (104 kg)', 'People over 250 lbs (113 kg)',
                                                        'People over 264 lbs (120 kg)', 'People over 270 lbs (122 kg)', 'People over 280 lbs (127 kg)', 'People over 300 lbs (136 kg)', 'People over 350 lbs (159 kg)',
                                                        'People over 55 years', 'People over 60 years', 'People over 65 years', 'People over 75 years', 'People prone to seasickness', 'People under 3 ft 3 in (100 cm)',
                                                        'People under 3 ft 6 in (110 cm)', 'People under 3 ft 9 in (120 cm)', 'People under 4 ft 3 in (130 cm)', 'People under 4 ft 4 in (135 cm)',
                                                        'People under 4 ft 6 in (140 cm)', 'People under 4 ft 8 in (145 cm)', 'People under 4 ft 9 in (150 cm)', 'People under 5 ft 1 in (155 cm)',
                                                        'People under 5 ft 2 in (160 cm)', 'People under 17 years', 'People under 19 years', 'Children under 44 lbs (20 kg)', 'People under 20 years',
                                                        'People under 21 years', 'People under 66 lbs (30 kg)', 'People under 77 lbs (35 kg)', 'People under 88 lbs (40 kg)', 'People under 99 lbs (45 kg)',
                                                        'Children under 50 lbs (23 kg)', "People who can\'t drive manual transmission", "People who can\'t ride a bike", 'People with a cold',
                                                        'People with animal allergies', 'People with back problems', 'People with claustrophobia', 'People with epilepsy', 'People with food allergies',
                                                        'People with gluten intolerance', 'People with haemophilia', 'People with heart problems', 'People with insect allergies', 'People with kidney problems',
                                                        'People with mobility impairments', 'People with motion sickness', "People without driver\’s license", 'People without experience',
                                                        'People with recent surgeries', 'People with respiratory issues', 'People with vertigo', 'People with pre-existing medical conditions',
                                                        'Pregnant women', 'People over 80 years', 'Children under 33 lbs (15 kg)', 'Vegans', 'Vegetarians', 'Visually impaired people', 'Wheelchair users'
                                                    ];
                                                    const results = allSuitability.filter(item => item.toLowerCase().includes(val) && !formData.notSuitableFor.includes(item));
                                                    setSuitabilitySearch(val);
                                                    setSuitabilitySuggestions(results);
                                                }}
                                                onFocus={() => {
                                                    const results = [
                                                        'People over 70 years', 'People over 95 years', 'People with altitude sickness', 'Babies under 1 year', 'Children under 10 years',
                                                        'Children under 11 years', 'Children under 12 years', 'Children under 13 years', 'Children under 14 years', 'Children under 15 years',
                                                        'Children under 16 years', 'Children under 18 years', 'Children under 2 years', 'Children under 3 years', 'Children under 4 years',
                                                        'Children under 5 years', 'Children under 6 years', 'Children under 7 years', 'Children under 8 years', 'Children under 3 ft (90 cm)',
                                                        'Children under 9 years', 'Cruise ship guests', 'People with diabetes', 'Divers without certification', 'People diving up to 24 hours prior',
                                                        'Drivers under 18 years', 'Drivers under 21 years', 'Drivers under 16 years', 'Hearing-impaired people', 'People with high blood pressure',
                                                        'People with lactose intolerance', 'People with low level of fitness', 'Non-swimmers', 'People with nut allergies', 'People over 287 lbs (130 kg)',
                                                        'People over 309 lbs (140 kg)', 'People over 209 lbs (95 kg)', 'People afraid of heights', 'People over 220 lbs (100 kg)', 'People over 243 lbs (110 kg)',
                                                        'People over 254 lbs (115 kg)', 'People over 260 lbs (118 kg)', 'People over 275 lbs (125 kg)', 'People over 297 lbs (135 kg)', 'People over 331 lbs (150 kg)',
                                                        'People over 5 ft 9 in (180 cm)', 'People over 6 ft 6 in (200 cm)', 'People over 200 lbs (91 kg)', 'People over 230 lbs (104 kg)', 'People over 250 lbs (113 kg)',
                                                        'People over 264 lbs (120 kg)', 'People over 270 lbs (122 kg)', 'People over 280 lbs (127 kg)', 'People over 300 lbs (136 kg)', 'People over 350 lbs (159 kg)',
                                                        'People over 55 years', 'People over 60 years', 'People over 65 years', 'People over 75 years', 'People prone to seasickness', 'People under 3 ft 3 in (100 cm)',
                                                        'People under 3 ft 6 in (110 cm)', 'People under 3 ft 9 in (120 cm)', 'People under 4 ft 3 in (130 cm)', 'People under 4 ft 4 in (135 cm)',
                                                        'People under 4 ft 6 in (140 cm)', 'People under 4 ft 8 in (145 cm)', 'People under 4 ft 9 in (150 cm)', 'People under 5 ft 1 in (155 cm)',
                                                        'People under 5 ft 2 in (160 cm)', 'People under 17 years', 'People under 19 years', 'Children under 44 lbs (20 kg)', 'People under 20 years',
                                                        'People under 21 years', 'People under 66 lbs (30 kg)', 'People under 77 lbs (35 kg)', 'People under 88 lbs (40 kg)', 'People under 99 lbs (45 kg)',
                                                        'Children under 50 lbs (23 kg)', "People who can\'t drive manual transmission", "People who can\'t ride a bike", 'People with a cold',
                                                        'People with animal allergies', 'People with back problems', 'People with claustrophobia', 'People with epilepsy', 'People with food allergies',
                                                        'People with gluten intolerance', 'People with haemophilia', 'People with heart problems', 'People with insect allergies', 'People with kidney problems',
                                                        'People with mobility impairments', 'People with motion sickness', "People without driver\’s license", 'People without experience',
                                                        'People with recent surgeries', 'People with respiratory issues', 'People with vertigo', 'People with pre-existing medical conditions',
                                                        'Pregnant women', 'People over 80 years', 'Children under 33 lbs (15 kg)', 'Vegans', 'Vegetarians', 'Visually impaired people', 'Wheelchair users'
                                                    ].filter(item => item.toLowerCase().includes(suitabilitySearch.toLowerCase()) && !formData.notSuitableFor.includes(item));
                                                    setSuitabilitySuggestions(results);
                                                }}
                                            />
                                            {suitabilitySuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-[60] max-h-60 overflow-y-auto py-2 animate-fade-in">
                                                    {suitabilitySuggestions.map(item => (
                                                        <div key={item} onClick={() => { setFormData(p => ({ ...p, notSuitableFor: [...p.notSuitableFor, item] })); setSuitabilitySearch(''); setSuitabilitySuggestions([]); }} className="px-5 py-2.5 hover:bg-gray-50 text-[14px] text-[#1A2B49] font-medium cursor-pointer">{item}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.notSuitableFor.map(item => (
                                                <div key={item} className="flex items-center gap-2 bg-[#F0F2F5] text-[#1A2B49] px-3 py-1.5 rounded-full text-[13px] font-bold border border-gray-200 shadow-sm animate-pop-in">
                                                    {item}
                                                    <FaTimes className="cursor-pointer hover:text-red-500" onClick={() => setFormData(p => ({ ...p, notSuitableFor: p.notSuitableFor.filter(x => x !== item) }))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Not Allowed */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">What's not allowed? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                            <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                        </div>
                                        <p className="text-[13px] text-gray-500">List any object, clothing, or action that's not allowed on your activity, such as sleeveless shirts. This information appears on the activity details page & voucher.</p>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071EB]">
                                                <FaSearch size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search for items"
                                                className="w-full bg-white border border-gray-300 rounded-[4px] pl-11 pr-4 py-3 text-[15px] outline-none focus:border-[#0071EB] transition-all shadow-sm"
                                                value={allowedSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value.toLowerCase();
                                                    const allAllowed = [
                                                        'Alcohol and drugs', 'Audio recording', 'Baby carriages', 'Baby strollers', 'Bachelor & bachelorette party groups', 'Party groups',
                                                        'Backpacks', 'Bags', 'Bare feet', 'Bikes', 'Boots', 'Bright colors', 'Cameras', 'Cellphones', 'Chewing gum', 'Climbing', 'Cooler', 'Crutches',
                                                        'Handcarts', 'Alcoholic drinks in the vehicle', 'Drinks in the vehicle', 'Drinks', 'Drones', 'Food in the vehicle', 'Electric wheelchairs',
                                                        'Electronic devices', 'Explosive substances', 'Feeding animals', 'Firework', 'Fishing', 'Flashlight', 'Flash photography', 'Food', 'Food and drinks',
                                                        'Food and drinks in the vehicle', 'Glass objects', 'Hats', 'Headphones', 'High-heeled shoes', 'Shoes indoors', 'Insect repellent', 'Intoxication',
                                                        'Jeans', 'Jewelry', 'Jumping', 'Littering', 'Luggage or large bags', 'Making fire', 'Making noise', 'Military-style clothing', 'Mobility scooters',
                                                        'Loose clothing', 'Non-folding strollers', 'Non-folding wheelchairs', 'Waterproof cameras', 'Nudity', 'Open-toed shoes', 'Oversize luggage',
                                                        'Padlocks', 'Pets', 'Pets (assistance dogs allowed)', 'Photography inside', 'Plastic bags', 'Plastic bottles', 'Professional cameras', 'Red wine',
                                                        'Riding the animals', 'Ripped clothing', 'Sandals or flip flops', 'Scooter', 'See-through clothing', 'Selfie sticks', 'Shoes', 'Shorts', 'Short skirts',
                                                        'Skateboards', 'Skates', 'Skirts', 'Sleeveless shirts', 'Slippers', 'Smoking', 'Smoking indoors', 'Smoking in the vehicle', 'Snorkeling', 'Speakers',
                                                        'Sports shoes', 'Sportswear', 'Sprays or Aerosols', 'Strong fragrances', 'Sunglasses', 'Sunscreen', 'Surfboards', 'Swimming', 'Swimwear', 'Tablets/iPads',
                                                        'Tight clothing', 'Touching the exhibits', 'Touching marine life', 'Touching animals', 'Touching plants', 'Tripods', 'Umbrellas', 'Unaccompanied minors',
                                                        'Visible tattoos', 'Valuables', 'Vaping', 'Video recording', 'Walking frames', 'Walking sticks', 'Weapons or sharp objects', 'Wearing a costume'
                                                    ];
                                                    const results = allAllowed.filter(item => item.toLowerCase().includes(val) && !formData.notAllowed.includes(item));
                                                    setAllowedSearch(val);
                                                    setAllowedSuggestions(results);
                                                }}
                                                onFocus={() => {
                                                    const results = [
                                                        'Alcohol and drugs', 'Audio recording', 'Baby carriages', 'Baby strollers', 'Bachelor & bachelorette party groups', 'Party groups',
                                                        'Backpacks', 'Bags', 'Bare feet', 'Bikes', 'Boots', 'Bright colors', 'Cameras', 'Cellphones', 'Chewing gum', 'Climbing', 'Cooler', 'Crutches',
                                                        'Handcarts', 'Alcoholic drinks in the vehicle', 'Drinks in the vehicle', 'Drinks', 'Drones', 'Food in the vehicle', 'Electric wheelchairs',
                                                        'Electronic devices', 'Explosive substances', 'Feeding animals', 'Firework', 'Fishing', 'Flashlight', 'Flash photography', 'Food', 'Food and drinks',
                                                        'Food and drinks in the vehicle', 'Glass objects', 'Hats', 'Headphones', 'High-heeled shoes', 'Shoes indoors', 'Insect repellent', 'Intoxication',
                                                        'Jeans', 'Jewelry', 'Jumping', 'Littering', 'Luggage or large bags', 'Making fire', 'Making noise', 'Military-style clothing', 'Mobility scooters',
                                                        'Loose clothing', 'Non-folding strollers', 'Non-folding wheelchairs', 'Waterproof cameras', 'Nudity', 'Open-toed shoes', 'Oversize luggage',
                                                        'Padlocks', 'Pets', 'Pets (assistance dogs allowed)', 'Photography inside', 'Plastic bags', 'Plastic bottles', 'Professional cameras', 'Red wine',
                                                        'Riding the animals', 'Ripped clothing', 'Sandals or flip flops', 'Scooter', 'See-through clothing', 'Selfie sticks', 'Shoes', 'Shorts', 'Short skirts',
                                                        'Skateboards', 'Skates', 'Skirts', 'Sleeveless shirts', 'Slippers', 'Smoking', 'Smoking indoors', 'Smoking in the vehicle', 'Snorkeling', 'Speakers',
                                                        'Sports shoes', 'Sportswear', 'Sprays or Aerosols', 'Strong fragrances', 'Sunglasses', 'Sunscreen', 'Surfboards', 'Swimming', 'Swimwear', 'Tablets/iPads',
                                                        'Tight clothing', 'Touching the exhibits', 'Touching marine life', 'Touching animals', 'Touching plants', 'Tripods', 'Umbrellas', 'Unaccompanied minors',
                                                        'Visible tattoos', 'Valuables', 'Vaping', 'Video recording', 'Walking frames', 'Walking sticks', 'Weapons or sharp objects', 'Wearing a costume'
                                                    ].filter(item => item.toLowerCase().includes(allowedSearch.toLowerCase()) && !formData.notAllowed.includes(item));
                                                    setAllowedSuggestions(results);
                                                }}
                                            />
                                            {allowedSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-[60] max-h-60 overflow-y-auto py-2 animate-fade-in">
                                                    {allowedSuggestions.map(item => (
                                                        <div key={item} onClick={() => { setFormData(p => ({ ...p, notAllowed: [...p.notAllowed, item] })); setAllowedSearch(''); setAllowedSuggestions([]); }} className="px-5 py-2.5 hover:bg-gray-50 text-[14px] text-[#1A2B49] font-medium cursor-pointer">{item}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.notAllowed.map(item => (
                                                <div key={item} className="flex items-center gap-2 bg-[#F0F2F5] text-[#1A2B49] px-3 py-1.5 rounded-full text-[13px] font-bold border border-gray-200 shadow-sm animate-pop-in">
                                                    {item}
                                                    <FaTimes className="cursor-pointer hover:text-red-500" onClick={() => setFormData(p => ({ ...p, notAllowed: p.notAllowed.filter(x => x !== item) }))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pet Policy */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">What is the pet policy? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.petFriendly ? 'bg-[#0071EB] border-[#0071EB]' : 'bg-white border-gray-300'}`}>
                                                {formData.petFriendly && <FaCheckCircle className="text-white text-[10px]" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={formData.petFriendly} onChange={(e) => setFormData(p => ({ ...p, petFriendly: e.target.checked }))} />
                                            <span className="text-[14px] font-bold text-[#1A2B49]">Pet-friendly</span>
                                        </label>
                                        <div className="space-y-2">
                                            <p className="text-[13px] text-gray-500">Add any additional information about certain pet policies, including restrictions (e.g. service animals only, only allow dogs under 12 kg)</p>
                                            <textarea
                                                className="w-full border border-gray-300 rounded-[4px] p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[140px] resize-none shadow-sm"
                                                placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                value={formData.petPolicy}
                                                onChange={(e) => setFormData(p => ({ ...p, petPolicy: e.target.value }))}
                                                maxLength={1000}
                                            />
                                            <div className="text-right text-[11px] text-gray-500 font-bold">{formData.petPolicy.length} / 1000</div>
                                        </div>
                                    </div>

                                    {/* Mandatory Items */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">What mandatory items must the customer bring with them? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                        </div>
                                        <p className="text-[13px] text-gray-500">Such as a towel for a boat tour, or comfortable shoes for a hike. This information appears on the activity details page & voucher.</p>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071EB]">
                                                <FaSearch size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search for items"
                                                className="w-full bg-white border border-gray-300 rounded-[4px] pl-11 pr-4 py-3 text-[15px] outline-none focus:border-[#0071EB] transition-all shadow-sm"
                                                value={mandatorySearch}
                                                onChange={(e) => {
                                                    const val = e.target.value.toLowerCase();
                                                    const allMandatory = [
                                                        'Beachwear', 'Binoculars', 'Biodegradable sunscreen', 'Biodegradable insect repellent', 'Boating licence', 'Camera', 'Cash', 'Change of clothes',
                                                        'Charged Smartphone', 'Child safety seat', 'Climbing gear', 'Closed-toe shoes', 'Clothes that can get dirty', 'Collared shirt', 'Comfortable clothes',
                                                        'Comfortable shoes', 'Cooking equipment', 'Credit card', 'Cycling clothing', 'Daypack', 'Deposit', 'Disability card', 'Dive log', 'Diving certification',
                                                        'Downloaded app', 'Drinks', "Driver\'s license", 'Face mask or protective covering', 'FFP2 mask', 'First aid kit', 'Fishing license', 'Flashlight', 'Flip-flops',
                                                        'Food', 'Food and drinks', 'Game box', 'Garbage bag', 'Gloves', 'Goggles', 'Trekking gear', 'GPS/map', 'Hair tie', 'Hand sanitizer or tissues', 'Hat',
                                                        'Head covering or kippah', 'Headphones', 'Headscarf', 'Helmet', 'Hiking pants', 'Hiking shoes', 'Ingredients', 'Insect repellent', "International driver\'s license",
                                                        'Internet access', 'Jacket', 'Breathable clothing', 'Long pants', 'Long-sleeved shirt', 'Medical mask', 'Medical statement', 'Motion sickness prevention',
                                                        'Outdoor clothing', 'Pacemaker card', 'Packed lunch', 'Passport', 'Passport, copy accepted', 'Passport or ID card', 'Passport or ID card for children',
                                                        'Passport or ID card, copy accepted', 'Passport-sized photo', 'Pen', 'Personal medication', 'Pillow', 'Power bank', 'Public transport ticket', 'Quick-dry clothing',
                                                        'Rain gear', 'Reusable water bottle', 'Sandals', 'Sarong', 'Scarf', 'Shorts', 'Signed waiver', 'Sleeping bag', 'Snacks', 'Snorkeling gear', 'Snow clothing',
                                                        'Socks', 'Sports shoes', 'Sportswear', 'Storage device', 'Student card', 'Sunglasses', 'Sun hat', 'Sunscreen', 'Swimming cap', 'Swimwear', 'Tent',
                                                        'Thermal clothing', 'Tie', 'Toiletries', 'Towel', 'Travel insurance', 'Tripod', 'T-shirt', 'Umbrella', 'ID card, copy accepted', 'Visa, if required',
                                                        'Warm clothing', 'Warm shoes', 'Water', 'Waterproof bag', 'Waterproof camera', 'Waterproof shoes', 'Water shoes', 'Weather-appropriate clothing',
                                                        'Wetsuit', 'Windbreaker', 'Winter sports gear', 'Your own vehicle'
                                                    ];
                                                    const results = allMandatory.filter(item => item.toLowerCase().includes(val) && !formData.mandatoryItems.includes(item));
                                                    setMandatorySearch(val);
                                                    setMandatorySuggestions(results);
                                                }}
                                                onFocus={() => {
                                                    const results = [
                                                        'Beachwear', 'Binoculars', 'Biodegradable sunscreen', 'Biodegradable insect repellent', 'Boating licence', 'Camera', 'Cash', 'Change of clothes',
                                                        'Charged Smartphone', 'Child safety seat', 'Climbing gear', 'Closed-toe shoes', 'Clothes that can get dirty', 'Collared shirt', 'Comfortable clothes',
                                                        'Comfortable shoes', 'Cooking equipment', 'Credit card', 'Cycling clothing', 'Daypack', 'Deposit', 'Disability card', 'Dive log', 'Diving certification',
                                                        'Downloaded app', 'Drinks', "Driver\'s license", 'Face mask or protective covering', 'FFP2 mask', 'First aid kit', 'Fishing license', 'Flashlight', 'Flip-flops',
                                                        'Food', 'Food and drinks', 'Game box', 'Garbage bag', 'Gloves', 'Goggles', 'Trekking gear', 'GPS/map', 'Hair tie', 'Hand sanitizer or tissues', 'Hat',
                                                        'Head covering or kippah', 'Headphones', 'Headscarf', 'Helmet', 'Hiking pants', 'Hiking shoes', 'Ingredients', 'Insect repellent', "International driver\'s license",
                                                        'Internet access', 'Jacket', 'Breathable clothing', 'Long pants', 'Long-sleeved shirt', 'Medical mask', 'Medical statement', 'Motion sickness prevention',
                                                        'Outdoor clothing', 'Pacemaker card', 'Packed lunch', 'Passport', 'Passport, copy accepted', 'Passport or ID card', 'Passport or ID card for children',
                                                        'Passport or ID card, copy accepted', 'Passport-sized photo', 'Pen', 'Personal medication', 'Pillow', 'Power bank', 'Public transport ticket', 'Quick-dry clothing',
                                                        'Rain gear', 'Reusable water bottle', 'Sandals', 'Sarong', 'Scarf', 'Shorts', 'Signed waiver', 'Sleeping bag', 'Snacks', 'Snorkeling gear', 'Snow clothing',
                                                        'Socks', 'Sports shoes', 'Sportswear', 'Storage device', 'Student card', 'Sunglasses', 'Sun hat', 'Sunscreen', 'Swimming cap', 'Swimwear', 'Tent',
                                                        'Thermal clothing', 'Tie', 'Toiletries', 'Towel', 'Travel insurance', 'Tripod', 'T-shirt', 'Umbrella', 'ID card, copy accepted', 'Visa, if required',
                                                        'Warm clothing', 'Warm shoes', 'Water', 'Waterproof bag', 'Waterproof camera', 'Waterproof shoes', 'Water shoes', 'Weather-appropriate clothing',
                                                        'Wetsuit', 'Windbreaker', 'Winter sports gear', 'Your own vehicle'
                                                    ].filter(item => item.toLowerCase().includes(mandatorySearch.toLowerCase()) && !formData.mandatoryItems.includes(item));
                                                    setMandatorySuggestions(results);
                                                }}
                                            />
                                            {mandatorySuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-[60] max-h-60 overflow-y-auto py-2 animate-fade-in">
                                                    {mandatorySuggestions.map(item => (
                                                        <div key={item} onClick={() => { setFormData(p => ({ ...p, mandatoryItems: [...p.mandatoryItems, item] })); setMandatorySearch(''); setMandatorySuggestions([]); }} className="px-5 py-2.5 hover:bg-gray-50 text-[14px] text-[#1A2B49] font-medium cursor-pointer">{item}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.mandatoryItems.map(item => (
                                                <div key={item} className="flex items-center gap-2 bg-[#F0F2F5] text-[#1A2B49] px-3 py-1.5 rounded-full text-[13px] font-bold border border-gray-200 shadow-sm animate-pop-in">
                                                    {item}
                                                    <FaTimes className="cursor-pointer hover:text-red-500" onClick={() => setFormData(p => ({ ...p, mandatoryItems: p.mandatoryItems.filter(x => x !== item) }))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Know Before You Go */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">Know before you go <span className="text-gray-400 font-medium">(optional)</span></h2>
                                            <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                        </div>
                                        <p className="text-[13px] text-gray-600">Add anything else that customers should know before making a booking. If you need something from the customer after booking, this should go on the voucher instead.</p>
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full border border-gray-300 rounded-[4px] p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[140px] resize-none shadow-sm"
                                                placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                value={formData.knowBeforeYouGo}
                                                onChange={(e) => setFormData(p => ({ ...p, knowBeforeYouGo: e.target.value }))}
                                                maxLength={1000}
                                            />
                                            <div className="text-right text-[11px] text-gray-500 font-bold">{formData.knowBeforeYouGo.length} / 1000</div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">How can customers contact you in case of an emergency? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                            <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                        </div>
                                        <p className="text-[13px] text-gray-500">This information appears on the voucher.</p>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-32 shrink-0">
                                                <select
                                                    className="w-full border border-gray-300 rounded-[4px] px-4 py-3 text-[15px] outline-none focus:border-[#0071EB] appearance-none bg-white font-medium"
                                                    value={formData.emergencyContact.countryCode}
                                                    onChange={(e) => setFormData(p => ({ ...p, emergencyContact: { ...p.emergencyContact, countryCode: e.target.value } }))}
                                                >
                                                    {[
                                                        'Afghanistan (+93)', 'Albania (+355)', 'Algeria (+213)', 'American Samoa (+1 684)', 'Andorra (+376)', 'Angola (+244)', 'Anguilla (+1 264)',
                                                        'Antigua and Barbuda (+1 268)', 'Argentina (+54)', 'Armenia (+374)', 'Aruba (+297)', 'Ascension Island (+247)', 'Australia (+61)', 'Austria (+43)',
                                                        'Azerbaijan (+994)', 'Bahamas (+1 242)', 'Bahrain (+973)', 'Bangladesh (+880)', 'Barbados (+1 246)', 'Belarus (+375)', 'Belgium (+32)',
                                                        'Belize (+501)', 'Benin (+229)', 'Bermuda (+1 441)', 'Bhutan (+975)', 'Bolivia (+591)', 'Bosnia and Herzegovina (+387)', 'Botswana (+267)',
                                                        'Brazil (+55)', 'British Virgin Islands (+1 284)', 'Brunei (+673)', 'Bulgaria (+359)', 'Burkina Faso (+226)', 'Burundi (+257)', 'Cambodia (+855)',
                                                        'Cameroon (+237)', 'Canada / United States (+1)', 'Cape Verde (+238)', 'Cayman Islands (+1 345)', 'Central African Republic (+236)', 'Chad (+235)',
                                                        'Chile (+56)', 'China (+86)', 'Colombia (+57)', 'Comoros (+269)', 'Congo-Brazzaville (+243)', 'Cook Islands (+682)', 'Costa Rica (+506)',
                                                        'Côte d\'Ivoire (+225)', 'Croatia (+385)', 'Cuba (+53)', 'Cyprus (+357)', 'Czech Republic (+420)', 'Denmark (+45)', 'Diego Garcia (+246)',
                                                        'Djibouti (+253)', 'Dominica (+1 767)', 'Dominican Republic (+1 829)', 'Ecuador (+593)', 'Egypt (+20)', 'El Salvador (+503)', 'Equatorial Guinea (+240)',
                                                        'Eritrea (+291)', 'Estonia (+372)', 'Ethiopia (+251)', 'Falkland Islands (+500)', 'Faroe Islands (+298)', 'Fiji (+679)', 'Finland (+358)',
                                                        'France (+33)', 'French Guiana (+594)', 'French Polynesia (+689)', 'Gabon (+241)', 'Gambia (+220)', 'Georgia (+995)', 'Germany (+49)', 'Ghana (+233)',
                                                        'Gibraltar (+350)', 'Greece (+30)', 'Greenland (+299)', 'Grenada (+1 473)', 'Guadeloupe (+590)', 'Guadeloupe (+596)', 'Guam (+1 671)',
                                                        'Guantanamo Bay (+539)', 'Guatemala (+502)', 'Guinea (+224)', 'Guinea-Bissau (+245)', 'Guyana (+592)', 'Haiti (+509)', 'Honduras (+504)',
                                                        'Hong Kong (+852)', 'Hungary (+36)', 'INMARSAT-Atl East (+871)', 'INMARSAT-Atl West (+874)', 'INMARSAT-Indian (+873)', 'INMARSAT-Pacific (+872)',
                                                        'Iceland (+354)', 'India (+91)', 'Indonesia (+62)', 'Iran (+98)', 'Iraq (+964)', 'Ireland (+353)', 'Israel (+972)', 'Italy (+39)', 'Jamaica (+1 876)',
                                                        'Japan (+81)', 'Jordan (+962)', 'Kazakhstan / Russia (+7)', 'Kenya (+254)', 'Kiribati (+686)', 'Kuwait (+965)', 'Kyrgyz Republic (+996)', 'Laos (+856)',
                                                        'Latvia (+371)', 'Lebanon (+961)', 'Lesotho (+266)', 'Liberia (+231)', 'Libya (+218)', 'Lithuania (+370)', 'Luxembourg (+352)', 'Macao (+853)',
                                                        'Macedonia (+389)', 'Madagascar (+261)', 'Malawi (+265)', 'Malaysia (+60)', 'Maldives (+960)', 'Mali (+223)', 'Malta (+356)', 'Marshall Islands (+692)',
                                                        'Mauritania (+222)', 'Mauritius (+230)', 'Mexico (+52)', 'Micronesia (+691)', 'Moldova (+373)', 'Monaco (+377)', 'Mongolia (+976)', 'Montenegro (+382)',
                                                        'Montserrat (+1 664)', 'Morocco (+212)', 'Mozambique (+258)', 'Myanmar (+95)', 'Namibia (+264)', 'Nauru (+674)', 'Nepal (+977)', 'Netherlands (+31)',
                                                        'Netherlands Antilles (+599)', 'New Caledonia (+687)', 'New Zealand (+64)', 'Nicaragua (+505)', 'Niger (+227)', 'Nigeria (+234)', 'Niue (+683)',
                                                        'Norfolk Island (+672)', 'North Korea (+850)', 'Northern Mariana Islands (+670)', 'Norway (+47)', 'Oman (+968)', 'Pakistan (+92)', 'Palau (+680)',
                                                        'Panama (+507)', 'Papua New Guinea (+675)', 'Paraguay (+595)', 'Peru (+51)', 'Philippines (+63)', 'Poland (+48)', 'Portugal (+351)', 'Qatar (+974)',
                                                        'Republic of the Congo (+242)', 'Romania (+40)', 'Russia / Kazakhstan (+7)', 'Rwanda (+250)', 'Réunion (+262)', 'Saint Helena (+290)',
                                                        'Saint Kitts and Nevis (+1 869)', 'Saint Martin (+721)', 'Saint Pierre and Miquelon (+508)', 'Saint Vincent and the Grenadines (+1 784)',
                                                        'Samoa (+685)', 'San Marino (+378)', 'Saudi Arabia (+966)', 'Senegal (+221)', 'Serbia (+381)', 'Seychelles (+248)', 'Sierra Leone (+232)',
                                                        'Singapore (+65)', 'Slovakia (+421)', 'Slovenia (+386)', 'Solomon Islands (+677)', 'Somalia (+252)', 'South Africa (+27)', 'South Korea (+82)',
                                                        'Spain (+34)', 'Sri Lanka (+94)', 'Sudan (+249)', 'Suriname (+597)', 'Swaziland (+268)', 'Sweden (+46)', 'Switzerland (+41)', 'Syria (+963)',
                                                        'São Tomé and Príncipe (+239)', 'Taiwan (+886)', 'Tajikistan (+992)', 'Tanzania (+255)', 'Thailand (+66)', 'Togo (+228)', 'Tonga (+676)',
                                                        'Trinidad and Tobago (+1 868)', 'Tunisia (+216)', 'Turkey (+90)', 'Turkmenistan (+993)', 'Turks and Caicos Islands (+1 649)', 'Tuvalu (+688)',
                                                        'Uganda (+256)', 'Ukraine (+380)', 'United Arab Emirates (+971)', 'United Kingdom (+44)', 'United States / Canada (+1)', 'Uruguay (+598)',
                                                        'Uzbekistan (+998)', 'Vanuatu (+678)', 'Venezuela (+58)', 'Vietnam (+84)', 'Wallis and Futuna (+681)', 'Yemen (+967)', 'Zambia (+259)', 'Zambia (+260)'
                                                    ].map(cc => <option key={cc} value={cc}>{cc}</option>)}
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400"><FaChevronDown size={12} /></div>
                                            </div>
                                            <input
                                                type="text"
                                                className="flex-1 border border-gray-300 rounded-[4px] px-4 py-3 text-[15px] outline-none focus:border-[#0071EB] font-medium placeholder-gray-300"
                                                placeholder="Phone number"
                                                value={formData.emergencyContact.number}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/\D/g, '');
                                                    setFormData(p => ({ ...p, emergencyContact: { ...p.emergencyContact, number: numericValue } }));
                                                }}
                                                maxLength={15}
                                                pattern="\d*"
                                            />
                                        </div>
                                        <div className="text-right text-[11px] text-gray-500 font-bold">{formData.emergencyContact.number.length} / 15</div>
                                    </div>

                                    {/* Voucher Info */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[15px] font-bold text-[#1A2B49]">What information needs to appear on the voucher? <span className="text-gray-400 font-medium">(optional)</span></h2>
                                            <FaInfoCircle className="text-[#0071EB] text-sm cursor-help" />
                                        </div>
                                        <p className="text-[13px] text-gray-500">Provide any other logistical information that hasn't been covered elsewhere. Customers will only see it after making a booking.</p>
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full border border-gray-300 rounded-[4px] p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[140px] resize-none shadow-sm"
                                                placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                value={formData.voucherInfo}
                                                onChange={(e) => setFormData(p => ({ ...p, voucherInfo: e.target.value }))}
                                                maxLength={1000}
                                            />
                                            <div className="text-right text-[11px] text-gray-500 font-bold">{formData.voucherInfo.length} / 1000</div>
                                        </div>
                                    </div>

                                    {/* Navigation footer */}
                                    <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                        <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                        <button
                                            className="h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] bg-[#0071EB] text-white hover:bg-blue-700 shadow-md sm:hover:px-8 transition-all whitespace-nowrap"
                                            onClick={async () => {
                                                const success = await handleSaveProgress();
                                                if (success) setSubStep('photos');
                                            }}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {subStep === 'photos' && (
                            <div className="animate-fade-in relative pb-40">
                                <div className="max-w-[750px]">
                                    <h1 className="text-[26px] font-bold text-[#1A2B49] mb-4 flex items-center gap-2 tracking-tight">Add photos to your product <div className="w-5 h-5 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold cursor-help transition-transform hover:scale-110">?</div></h1>

                                    {/* Top Alert Message Banner when Duplicate / Same Photo is Uploaded */}
                                    {photoError && (
                                        <div className="bg-red-600 text-white rounded-xl p-4 mb-6 shadow-lg flex items-center justify-between animate-pop-in border border-red-700">
                                            <div className="flex items-center gap-3 font-bold text-[15px]">
                                                <FaInfoCircle className="text-xl shrink-0 text-white" />
                                                <span>{photoError}</span>
                                            </div>
                                            <button
                                                onClick={() => setPhotoError('')}
                                                className="text-white hover:text-red-200 text-sm font-bold ml-4 p-1 bg-red-700 hover:bg-red-800 rounded-full w-7 h-7 flex items-center justify-center transition-colors shrink-0"
                                                title="Close message"
                                            >
                                                <FaTimes size={13} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Photo Instructions & Requirements in Red at the Top */}
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 shadow-sm">
                                        <h2 className="text-[16px] font-bold text-red-700 mb-3 flex items-center gap-2">
                                            <FaInfoCircle className="text-red-600 text-lg shrink-0" /> Photo Requirements & Instructions
                                        </h2>
                                        <ul className="space-y-2 text-[14px] text-red-700 font-medium leading-relaxed">
                                            <li className="flex items-start gap-2">
                                                <span className="text-red-500 font-bold">•</span>
                                                <span>Minimum 4 photos required. Choose bright, centered landscape photos (minimum 1280px wide).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-red-500 font-bold">•</span>
                                                <span>Valid formats: JPG, JPEG, PNG, or GIF (Maximum file size: 7 MB each).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-red-500 font-bold">•</span>
                                                <span>NO portrait/vertical photos, selfies, black & white, dark, or upside-down images.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-red-500 font-bold">•</span>
                                                <span>NO watermarks, photographer logos, readable license plates, AI-generated images, or offensive content.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Upload Zone (Drag photos option removed) */}
                                        <div
                                            className="mt-6 border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-[#0071EB] transition-all group cursor-pointer relative"
                                            onClick={() => document.getElementById('photo-upload').click()}
                                        >
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-[#0071EB] border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-[15px] font-bold text-[#0071EB]">Uploading photos...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4">
                                                    <button
                                                        type="button"
                                                        className="bg-[#0071EB] text-white px-8 py-3 rounded-full font-medium text-[14px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md active:scale-95"
                                                    >
                                                        <FaCloudUploadAlt size={20} />
                                                        Upload Photos
                                                    </button>
                                                    <p className="text-[13px] text-gray-500 font-medium">Select minimum 4 landscape photos (Max 7 MB per image)</p>
                                                </div>
                                            )}
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                            />
                                        </div>

                                        {/* Image Previews */}
                                        {formData.images.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 animate-fade-in">
                                                {formData.images.map((img, idx) => (
                                                    <div key={idx} className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                                        <img
                                                            src={img.startsWith('http') || img.startsWith('/') ? (img.startsWith('/') ? `${API_URL.replace('/api', '')}${img}` : img) : img}
                                                            alt={`Upload ${idx}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                                                className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 transition-all shadow-lg"
                                                                title="Delete image"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                            {idx === 0 && (
                                                                <span className="absolute top-2 left-2 bg-[#0071EB] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Cover</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Copyright Confirmation Card */}
                                        <div
                                            onClick={() => setFormData(p => ({ ...p, copyrightConfirmed: !p.copyrightConfirmed }))}
                                            className={`mt-10 p-5 rounded-xl border-2 transition-all cursor-pointer select-none ${formData.copyrightConfirmed ? 'bg-blue-50/60 border-[#0071EB] shadow-sm' : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${formData.copyrightConfirmed ? 'bg-[#0071EB] border-[#0071EB] text-white shadow-sm' : 'bg-white border-gray-400'}`}>
                                                    {formData.copyrightConfirmed && <FaCheck className="text-[11px]" />}
                                                </div>
                                                <p className="text-[13.5px] text-[#1A2B49] font-medium leading-relaxed">
                                                    I confirm that I own the copyright for these pictures and have obtained model release forms for any recognizable faces depicted. I affirm that I have not used any trademarks, logos, or imagery from third parties without proper authorization. I understand that I am liable for any copyright or trademark infringement. For more information, please visit our <span className="text-[#0071EB] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>terms and conditions</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation footer */}
                                <div className="pt-10 pb-6 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-3 sm:gap-4">
                                    <button className="w-full sm:w-auto text-center h-9 px-4 sm:px-6 rounded-full font-medium text-[12px] sm:text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-5 sm:hover:px-7 whitespace-nowrap" onClick={() => handleSaveProgress(true)}>Save and exit</button>
                                    <button
                                        className={`w-full sm:w-auto text-center h-9 px-4 sm:px-7 rounded-full font-medium text-[12px] sm:text-[13px] whitespace-nowrap transition-all ${formData.images.length >= 4 && formData.copyrightConfirmed ? 'bg-[#0071EB] text-white hover:bg-blue-700 shadow-md hover:px-8' : 'bg-[#E6E6E6] text-[#A3A3A3] cursor-not-allowed'}`}
                                        disabled={formData.images.length < 4 || !formData.copyrightConfirmed || uploading || loading}
                                        onClick={async () => {
                                            const success = await handleSaveProgress();
                                            if (success) setSubStep('options');
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {subStep === 'options' && (
                            <div className="animate-fade-in relative pb-40">
                                <div className="max-w-[750px] mx-auto text-center py-10">
                                    {/* Options Landing Page */}
                                    {!isAddingOption && (
                                        <>
                                            <h1 className="text-[28px] font-bold text-[#1A2B49] mb-4 flex items-center justify-start gap-2 tracking-tight text-left">
                                                Add booking option(s) to your product
                                                <div className="w-6 h-6 rounded-full border-2 border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[14px] font-bold cursor-help transition-transform hover:scale-110 inline-flex">?</div>
                                            </h1>
                                            <p className="text-[16px] text-[#2A3B59] font-medium leading-[1.6] mb-8 text-left">
                                                Options allow you to customize your activity and attract more customers. For example, your options can have different:
                                            </p>

                                            <ul className="text-left space-y-3 mb-12 ml-4">
                                                <li className="flex items-center gap-3 text-[15px] text-[#2A3B59] font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                    <span>durations (1 or 2 hours)</span>
                                                </li>
                                                <li className="flex items-center gap-3 text-[15px] text-[#2A3B59] font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                    <span>group sizes (10 or 20 people) or set-ups (private or public)</span>
                                                </li>
                                                <li className="flex items-center gap-3 text-[15px] text-[#2A3B59] font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                    <span>languages (English or Spanish)</span>
                                                </li>
                                                <li className="flex items-center gap-3 text-[15px] text-[#2A3B59] font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                    <span>inclusions (with or without lunch)</span>
                                                </li>
                                                <li className="flex items-center gap-3 text-[15px] text-[#2A3B59] font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                    <span>ways to start the activity (meeting point or hotel pickup)</span>
                                                </li>
                                            </ul>

                                            <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm text-left mb-12">
                                                <p className="text-[15px] text-[#2A3B59] leading-relaxed">
                                                    The option is where the pricing/availability are stored, and where bookings are made. So you need at least one option per product to start receiving bookings.
                                                </p>
                                            </div>

                                            {/* Options List */}
                                            {formData.bookingOptions.length > 0 && (
                                                <div className="grid gap-4 mb-10 text-left animate-fade-in">
                                                    {formData.bookingOptions.map((opt, idx) => (
                                                        <div key={idx} className="p-6 bg-white border border-gray-200 rounded-xl flex items-center justify-between group hover:border-[#0071EB] transition-all shadow-sm">
                                                            <div className="flex-1">
                                                                <h3 className="font-bold text-[#1A2B49] text-[16px]">{opt.title}</h3>
                                                                <p className="text-[13px] text-gray-500 font-medium tracking-tight mb-2">
                                                                    {opt.duration} • {opt.currency} {opt.pricingPersonDependency === 'category' ? `From ${opt.price}` : opt.price} • {opt.capacity} guests • {opt.privateGroup ? 'Private' : 'Shared'}
                                                                </p>
                                                                {opt.pricingPersonDependency === 'category' && opt.pricingTiers && opt.pricingTiers.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                        {opt.pricingTiers.map((tier, i) => (
                                                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[12px] font-medium text-gray-600">
                                                                                {tier.title}: {opt.currency ? opt.currency + ' ' : ''}{tier.price || 0}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); editOption(idx); }}
                                                                    className="h-9 px-5 rounded-full border border-gray-300 font-bold text-[13px] text-[#1A2B49] hover:border-[#0071EB] hover:text-[#0071EB] transition-all bg-white"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, bookingOptions: p.bookingOptions.filter((_, i) => i !== idx) })); }}
                                                                    className="text-gray-400 hover:text-red-500 transition-all p-2"
                                                                >
                                                                    <FaTrash size={15} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex justify-start gap-4">
                                                <button
                                                    onClick={() => setIsAddingOption(true)}
                                                    className="h-14 px-8 rounded-full border-2 border-[#0071EB] text-[#0071EB] font-bold text-[16px] hover:bg-[#F0F7FF] transition-all flex items-center gap-3 shadow-sm hover:shadow-md"
                                                >
                                                    <span className="text-xl font-bold">+</span>
                                                    Create new option
                                                </button>
                                                {formData.bookingOptions.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setSubStep('itinerary');
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="h-14 px-8 rounded-full bg-[#0071EB] text-white font-bold text-[16px] hover:bg-blue-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                                                    >
                                                        Continue
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Option Creation Wizard  */}
                                    {isAddingOption && (
                                        <div className="animate-fade-in relative text-left">
                                            {optionSubStep === 'setup' && (
                                                <div className="max-w-[650px] space-y-12">
                                                    {/* Option Title */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Option title</h3>
                                                        </div>
                                                        <p className="text-[14px] text-gray-500 font-medium">If you offer multiple options, write a short title that clearly explains to the customer how this option differs from the others.</p>
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                                className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm transition-all bg-white"
                                                                value={tempOption.title}
                                                                onChange={(e) => setTempOption(p => ({ ...p, title: e.target.value }))}
                                                                maxLength={60}
                                                            />
                                                            <div className="flex justify-end text-[11px] font-bold text-gray-400">{tempOption.title.length} / 60</div>
                                                        </div>
                                                    </div>

                                                    {/* Reference Code */}
                                                    <div className="space-y-4">
                                                        <h3 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-wider">Option reference code <span className="text-gray-400 capitalize">(optional)</span></h3>
                                                        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Add a reference code to help you keep track of which option the customer has booked. This is mainly for your records and won't be seen by the customer.</p>
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#0071EB] text-[14px] font-medium shadow-sm bg-white"
                                                                value={tempOption.referenceCode}
                                                                onChange={(e) => setTempOption(p => ({ ...p, referenceCode: e.target.value }))}
                                                                maxLength={20}
                                                            />
                                                            <div className="flex justify-end text-[11px] font-bold text-gray-400">{tempOption.referenceCode.length} / 20</div>
                                                        </div>
                                                    </div>

                                                    {/* Option Description */}
                                                    <div className="space-y-4">
                                                        <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Option description</h3>
                                                        <p className="text-[14px] text-gray-500 font-medium">If you can't clearly explain the differences between your options in the option title, use this section to describe what this option involves.</p>
                                                        <div className="space-y-2">
                                                            <div className="relative">
                                                                <textarea
                                                                    className="w-full border border-gray-300 rounded-lg p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm min-h-[140px] resize-none bg-white"
                                                                    value={tempOption.description}
                                                                    onChange={(e) => setTempOption(p => ({ ...p, description: e.target.value }))}
                                                                    maxLength={250}
                                                                />
                                                                <div className="absolute bottom-3 right-3 text-gray-300 transform rotate-45"><FaPen size={12} /></div>
                                                            </div>
                                                            <div className="flex justify-end text-[11px] font-bold text-gray-400">{tempOption.description ? tempOption.description.length : 0} / 250</div>
                                                        </div>
                                                    </div>

                                                    {/* Max Group Size */}
                                                    <div className="space-y-4">
                                                        <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Maximum group size</h3>
                                                        <p className="text-[14px] text-gray-500 font-medium">What's the maximum total of people in your activity for each time slot? This includes those who don't book on GetYourGuide.</p>
                                                        <select
                                                            className="w-[120px] border border-gray-300 rounded-lg p-3 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer"
                                                            value={tempOption.capacity}
                                                            onChange={(e) => setTempOption(p => ({ ...p, capacity: e.target.value }))}
                                                        >
                                                            {[...Array(50)].map((_, i) => (
                                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Languages */}
                                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Option setup</h3>
                                                            <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                                                <FaCheck size={8} /> Customizable
                                                            </div>
                                                            <div className="w-5 h-5 rounded-full border border-[#0071EB] text-[#0071EB] flex items-center justify-center text-[12px] font-bold">?</div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <p className="text-[14px] font-bold text-[#1A2B49]">What languages is the activity offered in?</p>
                                                            <p className="text-[13px] text-gray-500 font-medium">List all available languages to attract more customers.</p>
                                                            <div className="relative" ref={languageDropdownRef}>
                                                                <div className="relative">
                                                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Search for language"
                                                                        className="w-full border border-gray-300 rounded-lg p-3.5 pl-11 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm bg-white"
                                                                        value={languageSearch}
                                                                        onChange={(e) => {
                                                                            setLanguageSearch(e.target.value);
                                                                            setShowLanguageDropdown(true);
                                                                        }}
                                                                        onFocus={() => setShowLanguageDropdown(true)}
                                                                    />
                                                                </div>

                                                                {showLanguageDropdown && (
                                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar animate-pop-in">
                                                                        {LANGUAGES.filter(lang => lang.toLowerCase().includes(languageSearch.toLowerCase())).map((lang) => (
                                                                            <div
                                                                                key={lang}
                                                                                className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${tempOption.languages.includes(lang) ? 'bg-[#EBF5FF]' : 'hover:bg-gray-50'}`}
                                                                                onClick={() => {
                                                                                    const current = [...tempOption.languages];
                                                                                    if (current.includes(lang)) {
                                                                                        setTempOption(p => ({ ...p, languages: p.languages.filter(l => l !== lang) }));
                                                                                    } else {
                                                                                        setTempOption(p => ({ ...p, languages: [...p.languages, lang] }));
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tempOption.languages.includes(lang) ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                        {tempOption.languages.includes(lang) && <FaCheck className="text-white text-[10px]" />}
                                                                                    </div>
                                                                                    <span className={`text-[15px] ${tempOption.languages.includes(lang) ? 'font-bold text-[#0071EB]' : 'font-medium text-[#1A2B49]'}`}>{lang}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {LANGUAGES.filter(lang => lang.toLowerCase().includes(languageSearch.toLowerCase())).length === 0 && (
                                                                            <div className="p-8 text-center text-gray-400 font-medium">No languages found</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selected Languages Tags */}
                                                            {tempOption.languages.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-4">
                                                                    {tempOption.languages.map(lang => (
                                                                        <div key={lang} className="bg-blue-50 text-[#0071EB] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100">
                                                                            {lang}
                                                                            <button onClick={() => setTempOption(p => ({ ...p, languages: p.languages.filter(l => l !== lang) }))}>
                                                                                <FaTimes size={10} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-end gap-3 pt-2">
                                                                <span className="text-[13px] text-gray-500 font-bold italic">Add guide materials (optional)</span>
                                                                <div
                                                                    onClick={() => setTempOption(p => ({ ...p, hasGuideMaterials: !p.hasGuideMaterials }))}
                                                                    className={`w-10 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${tempOption.hasGuideMaterials ? 'bg-[#0071EB]' : 'bg-gray-200'}`}
                                                                >
                                                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${tempOption.hasGuideMaterials ? 'translate-x-4' : ''}`}></div>
                                                                </div>
                                                            </div>

                                                            {/* Guide Materials Sub-Options */}
                                                            {tempOption.hasGuideMaterials && (
                                                                <div className="space-y-8 mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in text-left">

                                                                    {/* Audio Guide Section */}
                                                                    <div className="space-y-4">
                                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                                            <div
                                                                                onClick={() => setTempOption(p => ({ ...p, hasAudioGuide: !p.hasAudioGuide }))}
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tempOption.hasAudioGuide ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}
                                                                            >
                                                                                {tempOption.hasAudioGuide && <FaCheck className="text-white text-[10px]" />}
                                                                            </div>
                                                                            <span className="text-[15px] font-bold text-[#1A2B49] group-hover:text-[#0071EB] transition-colors">Audio guide</span>
                                                                        </label>

                                                                        {tempOption.hasAudioGuide && (
                                                                            <div className="space-y-4 pt-2 animate-fade-in">
                                                                                <p className="text-[14px] font-bold text-[#1A2B49]">Audio guide available in</p>
                                                                                <div className="relative" ref={audioDropdownRef}>
                                                                                    <div className="relative">
                                                                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Search for language"
                                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 pl-11 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm bg-white"
                                                                                            value={audioSearch}
                                                                                            onChange={(e) => {
                                                                                                setAudioSearch(e.target.value);
                                                                                                setShowAudioDropdown(true);
                                                                                            }}
                                                                                            onFocus={() => setShowAudioDropdown(true)}
                                                                                        />
                                                                                    </div>
                                                                                    {showAudioDropdown && (
                                                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[250px] overflow-y-auto custom-scrollbar">
                                                                                            {LANGUAGES.filter(lang => lang.toLowerCase().includes(audioSearch.toLowerCase())).map((lang) => (
                                                                                                <div
                                                                                                    key={lang}
                                                                                                    className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${tempOption.audioGuideLanguages.includes(lang) ? 'bg-[#EBF5FF]' : 'hover:bg-gray-50'}`}
                                                                                                    onClick={() => {
                                                                                                        const current = [...tempOption.audioGuideLanguages];
                                                                                                        if (current.includes(lang)) {
                                                                                                            setTempOption(p => ({ ...p, audioGuideLanguages: p.audioGuideLanguages.filter(l => l !== lang) }));
                                                                                                        } else {
                                                                                                            setTempOption(p => ({ ...p, audioGuideLanguages: [...p.audioGuideLanguages, lang] }));
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tempOption.audioGuideLanguages.includes(lang) ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                            {tempOption.audioGuideLanguages.includes(lang) && <FaCheck className="text-white text-[10px]" />}
                                                                                                        </div>
                                                                                                        <span className={`text-[15px] ${tempOption.audioGuideLanguages.includes(lang) ? 'font-bold text-[#0071EB]' : 'font-medium text-[#1A2B49]'}`}>{lang}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {/* Tags for Audio */}
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {tempOption.audioGuideLanguages.map(lang => (
                                                                                        <div key={lang} className="bg-white text-[#0071EB] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100 shadow-sm">
                                                                                            {lang}
                                                                                            <button onClick={() => setTempOption(p => ({ ...p, audioGuideLanguages: p.audioGuideLanguages.filter(l => l !== lang) }))}>
                                                                                                <FaTimes size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Booklet Section */}
                                                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                                            <div
                                                                                onClick={() => setTempOption(p => ({ ...p, hasBooklets: !p.hasBooklets }))}
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tempOption.hasBooklets ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}
                                                                            >
                                                                                {tempOption.hasBooklets && <FaCheck className="text-white text-[10px]" />}
                                                                            </div>
                                                                            <span className="text-[15px] font-bold text-[#1A2B49] group-hover:text-[#0071EB] transition-colors">Information booklets</span>
                                                                        </label>

                                                                        {tempOption.hasBooklets && (
                                                                            <div className="space-y-4 pt-2 animate-fade-in">
                                                                                <p className="text-[14px] font-bold text-[#1A2B49]">Booklet available in</p>
                                                                                <div className="relative" ref={bookletDropdownRef}>
                                                                                    <div className="relative">
                                                                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Search for language"
                                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 pl-11 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm bg-white"
                                                                                            value={bookletSearch}
                                                                                            onChange={(e) => {
                                                                                                setBookletSearch(e.target.value);
                                                                                                setShowBookletDropdown(true);
                                                                                            }}
                                                                                            onFocus={() => setShowBookletDropdown(true)}
                                                                                        />
                                                                                    </div>
                                                                                    {showBookletDropdown && (
                                                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[250px] overflow-y-auto custom-scrollbar">
                                                                                            {LANGUAGES.filter(lang => lang.toLowerCase().includes(bookletSearch.toLowerCase())).map((lang) => (
                                                                                                <div
                                                                                                    key={lang}
                                                                                                    className={`px-6 py-3 flex items-center justify-between cursor-pointer transition-colors ${tempOption.bookletLanguages.includes(lang) ? 'bg-[#EBF5FF]' : 'hover:bg-gray-50'}`}
                                                                                                    onClick={() => {
                                                                                                        const current = [...tempOption.bookletLanguages];
                                                                                                        if (current.includes(lang)) {
                                                                                                            setTempOption(p => ({ ...p, bookletLanguages: p.bookletLanguages.filter(l => l !== lang) }));
                                                                                                        } else {
                                                                                                            setTempOption(p => ({ ...p, bookletLanguages: [...p.bookletLanguages, lang] }));
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tempOption.bookletLanguages.includes(lang) ? 'bg-[#0071EB] border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                            {tempOption.bookletLanguages.includes(lang) && <FaCheck className="text-white text-[10px]" />}
                                                                                                        </div>
                                                                                                        <span className={`text-[15px] ${tempOption.bookletLanguages.includes(lang) ? 'font-bold text-[#0071EB]' : 'font-medium text-[#1A2B49]'}`}>{lang}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {/* Tags for Booklet */}
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {tempOption.bookletLanguages.map(lang => (
                                                                                        <div key={lang} className="bg-white text-[#0071EB] px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100 shadow-sm">
                                                                                            {lang}
                                                                                            <button onClick={() => setTempOption(p => ({ ...p, bookletLanguages: p.bookletLanguages.filter(l => l !== lang) }))}>
                                                                                                <FaTimes size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Radio Groups */}
                                                    <div className="space-y-10">
                                                        {/* Private Activity */}
                                                        <div className="space-y-4">
                                                            <p className="text-[14px] font-bold text-[#1A2B49]">Is this a private activity?</p>
                                                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">This means that only one group or person can participate. There won't be other customers in the same activity.</p>
                                                            <div className="space-y-3">
                                                                {['No', 'Yes'].map((val) => (
                                                                    <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${((val === 'Yes' && tempOption.privateGroup) || (val === 'No' && !tempOption.privateGroup)) ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                            {((val === 'Yes' && tempOption.privateGroup) || (val === 'No' && !tempOption.privateGroup)) && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                        </div>
                                                                        <input
                                                                            type="radio"
                                                                            className="hidden"
                                                                            checked={(val === 'Yes' && tempOption.privateGroup) || (val === 'No' && !tempOption.privateGroup)}
                                                                            onChange={() => setTempOption(p => ({ ...p, privateGroup: val === 'Yes' }))}
                                                                        />
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">{val}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Skip the line */}
                                                        <div className="space-y-4">
                                                            <p className="text-[14px] font-bold text-[#1A2B49]">Will the customer skip the line to get in? If so, which line?</p>
                                                            <div className="space-y-3">
                                                                {['No', 'Yes'].map((val) => (
                                                                    <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${((val === 'Yes' && tempOption.skipLine) || (val === 'No' && !tempOption.skipLine)) ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                            {((val === 'Yes' && tempOption.skipLine) || (val === 'No' && !tempOption.skipLine)) && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                        </div>
                                                                        <input
                                                                            type="radio"
                                                                            className="hidden"
                                                                            checked={(val === 'Yes' && tempOption.skipLine) || (val === 'No' && !tempOption.skipLine)}
                                                                            onChange={() => setTempOption(p => ({ ...p, skipLine: val === 'Yes' }))}
                                                                        />
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">{val}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {tempOption.skipLine && (
                                                                <select
                                                                    className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-medium bg-white cursor-pointer mt-2 animate-fade-in shadow-sm text-[#1A2B49]"
                                                                    value={tempOption.skipLineType}
                                                                    onChange={(e) => setTempOption(p => ({ ...p, skipLineType: e.target.value }))}
                                                                >
                                                                    <option value="">Select skip-the-line type</option>
                                                                    <option value="tickets">Skip the line to get tickets</option>
                                                                    <option value="entrance">Skip the line through a separate entrance</option>
                                                                    <option value="security">Skip the line through express security check</option>
                                                                    <option value="elevators">Skip the line through express elevators</option>
                                                                </select>
                                                            )}
                                                        </div>

                                                        {/* Wheelchair Accessible */}
                                                        <div className="space-y-4">
                                                            <p className="text-[14px] font-bold text-[#1A2B49]">Is the activity wheelchair accessible?</p>
                                                            <div className="space-y-3">
                                                                {['No', 'Yes'].map((val) => (
                                                                    <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${((val === 'Yes' && tempOption.wheelchairAccessible) || (val === 'No' && !tempOption.wheelchairAccessible)) ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                            {((val === 'Yes' && tempOption.wheelchairAccessible) || (val === 'No' && !tempOption.wheelchairAccessible)) && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                        </div>
                                                                        <input
                                                                            type="radio"
                                                                            className="hidden"
                                                                            checked={(val === 'Yes' && tempOption.wheelchairAccessible) || (val === 'No' && !tempOption.wheelchairAccessible)}
                                                                            onChange={() => setTempOption(p => ({ ...p, wheelchairAccessible: val === 'Yes' }))}
                                                                        />
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">{val}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Duration or Validity */}
                                                        <div className="space-y-6 pt-10 border-t border-gray-100">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Duration or validity</h3>
                                                                <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                                                    <FaCheck size={8} /> Customizable
                                                                </div>
                                                            </div>
                                                            <p className="text-[14px] text-gray-500 font-medium leading-relaxed">Some activities start and stop at specific times, like a tour. Others allow customers to use their ticket anytime within a certain amount of time, like a 2-day city pass.</p>
                                                            <p className="text-[14px] font-bold text-[#1A2B49]">Which best describes your activity?</p>

                                                            <div className="space-y-6">
                                                                {/* Duration Option */}
                                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.durationSelection === 'duration' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.durationSelection === 'duration' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input
                                                                        type="radio"
                                                                        className="hidden"
                                                                        checked={tempOption.durationSelection === 'duration'}
                                                                        onChange={() => setTempOption(p => ({ ...p, durationSelection: 'duration' }))}
                                                                    />
                                                                    <div className="space-y-1">
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">It lasts for a specific amount of time (duration). Includes transfer time.</span>
                                                                        <p className="text-[13px] text-gray-500 font-medium italic">Example: 3-hour guided tour</p>
                                                                    </div>
                                                                </label>

                                                                {/* Validity Option */}
                                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.durationSelection === 'validity' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.durationSelection === 'validity' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input
                                                                        type="radio"
                                                                        className="hidden"
                                                                        checked={tempOption.durationSelection === 'validity'}
                                                                        onChange={() => setTempOption(p => ({ ...p, durationSelection: 'validity' }))}
                                                                    />
                                                                    <div className="space-y-1">
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">Customers can use their ticket anytime during a certain period (validity).</span>
                                                                        <p className="text-[13px] text-gray-500 font-medium italic">Example: museum tickets that can be used anytime during opening hours</p>
                                                                    </div>
                                                                </label>

                                                                {/* Duration/Validity Selector Inputs */}
                                                                <div className="pt-6 ml-8 space-y-4">
                                                                    {tempOption.durationSelection === 'validity' && (
                                                                        <select
                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer shadow-sm text-[#1A2B49] animate-fade-in"
                                                                            value={tempOption.validityType}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, validityType: e.target.value }))}
                                                                        >
                                                                            <option value="date_booked">Valid for a period of time from date booked</option>
                                                                            <option value="from_activation">Valid for a period of time from first activation</option>
                                                                            <option value="only_date_booked">Valid on the date booked</option>
                                                                        </select>
                                                                    )}

                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="number"
                                                                            className="w-[100px] border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white shadow-sm"
                                                                            value={tempOption.durationSelection === 'duration' ? tempOption.durationValue : tempOption.validityValue}
                                                                            onChange={(e) => setTempOption(p => ({
                                                                                ...p,
                                                                                [p.durationSelection === 'duration' ? 'durationValue' : 'validityValue']: e.target.value
                                                                            }))}
                                                                        />
                                                                        <select
                                                                            className="w-[140px] border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer shadow-sm"
                                                                            value={tempOption.durationSelection === 'duration' ? tempOption.durationUnit : tempOption.validityUnit}
                                                                            onChange={(e) => setTempOption(p => ({
                                                                                ...p,
                                                                                [p.durationSelection === 'duration' ? 'durationUnit' : 'validityUnit']: e.target.value
                                                                            }))}
                                                                        >
                                                                            <option value="Minute(s)">Minute(s)</option>
                                                                            <option value="Hour(s)">Hour(s)</option>
                                                                            <option value="Day(s)">Day(s)</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step Navigation Bottom */}
                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-12 mt-12">
                                                        <button
                                                            onClick={() => handleSaveOption(true)}
                                                            className="w-full sm:w-auto px-6 py-2 rounded-full border border-[#0071EB] text-[#0071EB] font-medium text-[13px] hover:bg-blue-50 transition-all shadow-sm text-center"
                                                        >
                                                            Save and exit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleSaveOption(false);
                                                                setOptionSubStep('meeting');
                                                            }}
                                                            className="w-full sm:w-auto px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[13px] hover:bg-blue-700 shadow-sm transition-all active:scale-95 text-center whitespace-nowrap"
                                                        >
                                                            Continue
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Meeting Point or Pickup Step */}
                                            {optionSubStep === 'meeting' && (
                                                <div className="animate-fade-in text-left">
                                                    <div className="flex items-center gap-2 mb-8">
                                                        <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Meeting point or pickup</h2>
                                                        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                                            <FaCheck size={8} /> Customizable
                                                        </div>
                                                    </div>

                                                    <div className="space-y-10">
                                                        {/* Choice Section */}
                                                        <div className="space-y-4">
                                                            <p className="text-[15px] font-bold text-[#1A2B49]">How do customers get to the activity?</p>
                                                            <div className="space-y-4">
                                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.meetingType === 'meeting' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.meetingType === 'meeting' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.meetingType === 'meeting'} onChange={() => setTempOption(p => ({ ...p, meetingType: 'meeting', pickupType: 'any', pickupTimeType: 'before', pickupConfirmationType: 'day_before', pickupTimeSlots: '', pickupDescription: '', transportationType: '' }))} />
                                                                    <div className="space-y-1">
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">They go to the starting point of the activity by themselves (e.g. meeting point, entrance)</span>
                                                                    </div>
                                                                </label>

                                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.meetingType === 'pickup' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.meetingType === 'pickup' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.meetingType === 'pickup'} onChange={() => setTempOption(p => ({ ...p, meetingType: 'pickup', meetingAddress: '', meetingDescription: '', meetingImages: [], arrivalTime: '' }))} />
                                                                    <div className="space-y-1">
                                                                        <span className="text-[15px] font-bold text-[#1A2B49]">They get picked up (by bus, car, etc.)</span>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Scenario A: Meeting Point */}
                                                        {tempOption.meetingType === 'meeting' && (
                                                            <div className="space-y-8 pt-6 border-t border-gray-100 animate-fade-in">
                                                                <div className="space-y-4">
                                                                    <p className="text-[16px] font-bold text-[#1A2B49]">Meeting point</p>
                                                                    <div className="space-y-2">
                                                                        <p className="text-[14px] font-medium text-gray-600">Add meeting point address</p>
                                                                        <div className="flex gap-3">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Enter meeting point address"
                                                                                className="flex-1 border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-medium shadow-sm bg-white"
                                                                                value={tempOption.meetingAddress}
                                                                                onChange={(e) => setTempOption(p => ({ ...p, meetingAddress: e.target.value }))}
                                                                            />
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setTempAddressInput(tempOption.meetingAddress);
                                                                                    setAddressModalType('meeting');
                                                                                    setShowAddressModal(true);
                                                                                }}
                                                                                className="px-6 py-3 rounded-lg border-2 border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-colors"
                                                                            >
                                                                                Add address
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <p className="text-[15px] font-bold text-[#1A2B49]">Describe the meeting point <span className="text-gray-400 font-normal">(optional)</span></p>
                                                                    <p className="text-[13px] text-gray-500 font-medium italic">Is there a specific landmark to look out for? How will customers recognize the guide?</p>
                                                                    <div className="relative">
                                                                        <textarea
                                                                            className="w-full border border-gray-300 rounded-lg p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[120px] shadow-sm"
                                                                            placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                                            maxLength={1000}
                                                                            value={tempOption.meetingDescription}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, meetingDescription: e.target.value }))}
                                                                        ></textarea>
                                                                        <div className="absolute bottom-3 right-3 text-[12px] text-gray-400 font-bold">{(tempOption.meetingDescription || '').length} / 1000</div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <p className="text-[15px] font-bold text-[#1A2B49]">Meeting point picture <span className="text-gray-400 font-normal">(optional)</span></p>
                                                                    <p className="text-[14px] text-gray-500 font-medium pb-2">Make sure you show a recognizable landmark or place to meet in your image.</p>
                                                                    <p className="text-[14px] text-gray-600 font-medium">Drag your photo into the area below or select "Upload photo".</p>

                                                                    <div className="w-full border border-dashed border-gray-300 rounded-xl p-8 bg-white transition-all">
                                                                        <div className="flex flex-col items-center justify-center min-h-[150px]">
                                                                            <div className="flex items-center gap-4 text-[#1A2B49] font-medium text-[15px]">
                                                                                <span>Drag photo here.</span>
                                                                                <span>or</span>
                                                                                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2.5 min-w-[140px] rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-colors bg-white shadow-sm">
                                                                                    <FaCloudUploadAlt size={18} />
                                                                                    Upload photo
                                                                                    <input
                                                                                        type="file"
                                                                                        multiple
                                                                                        accept="image/*"
                                                                                        className="hidden"
                                                                                        onChange={async (e) => {
                                                                                            const files = Array.from(e.target.files);
                                                                                            if (!files.length) return;
                                                                                            for (const file of files) {
                                                                                                const fileSignature = `${file.name.toLowerCase()}_${file.size}`;
                                                                                                const isDuplicate = tempOption.meetingImages?.some(img => img.includes(file.name.toLowerCase()));
                                                                                                if (isDuplicate) {
                                                                                                    alert(`Image ${file.name} is already uploaded!`);
                                                                                                    continue;
                                                                                                }
                                                                                                try {
                                                                                                    const uploadData = new FormData();
                                                                                                    uploadData.append('image', file);
                                                                                                    const config = {
                                                                                                        headers: {
                                                                                                            'Content-Type': 'multipart/form-data',
                                                                                                            Authorization: `Bearer ${localStorage.getItem('token')}`
                                                                                                        }
                                                                                                    };
                                                                                                    const { data } = await axios.post(`${API_URL}/upload`, uploadData, config);
                                                                                                    if (data.image) {
                                                                                                        setTempOption(p => ({
                                                                                                            ...p,
                                                                                                            meetingImages: [...(p.meetingImages || []), data.image]
                                                                                                        }));
                                                                                                    }
                                                                                                } catch (uploadErr) {
                                                                                                    console.error('Meeting image upload error:', uploadErr);
                                                                                                    const reader = new FileReader();
                                                                                                    reader.onloadend = () => {
                                                                                                        setTempOption(p => ({
                                                                                                            ...p,
                                                                                                            meetingImages: [...(p.meetingImages || []), reader.result]
                                                                                                        }));
                                                                                                    };
                                                                                                    reader.readAsDataURL(file);
                                                                                                }
                                                                                            }
                                                                                            if (e.target) e.target.value = '';
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                        </div>

                                                                        {tempOption.meetingImages && tempOption.meetingImages.length > 0 && (
                                                                            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100">
                                                                                {tempOption.meetingImages.map((img, idx) => (
                                                                                    <div key={idx} className="w-[140px] bg-gray-50 rounded-lg overflow-hidden border-2 border-[#0071EB] flex flex-col items-center justify-between shadow-sm relative pt-1">
                                                                                        <div className="w-[128px] h-[128px] bg-white rounded flex items-center justify-center p-1 overflow-hidden">
                                                                                            <img
                                                                                                src={typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:')) ? img : (img.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${img}` : `${API_URL.replace('/api', '')}/${img}`)}
                                                                                                alt={`Meeting Point ${idx}`}
                                                                                                className="max-w-full max-h-full object-contain"
                                                                                            />
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                setTempOption(p => ({
                                                                                                    ...p,
                                                                                                    meetingImages: p.meetingImages.filter((_, i) => i !== idx)
                                                                                                }));
                                                                                            }}
                                                                                            className="w-full mt-2 py-3 bg-gray-100 hover:bg-gray-200 text-[#1A2B49] font-medium text-[14px] flex items-center justify-center gap-2 transition-colors border-t border-gray-200"
                                                                                        >
                                                                                            <FaTimes size={14} className="text-gray-500" />
                                                                                            Delete
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <p className="text-[15px] font-bold text-[#1A2B49]">When do customers need to arrive?</p>
                                                                    <p className="text-[13px] text-gray-500 font-medium italic">Do customers need to arrive early to be ready for their activity - for example, to pick up tickets, paperwork, or equipment?</p>
                                                                    <select
                                                                        className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer shadow-sm text-[#1A2B49]"
                                                                        value={tempOption.arrivalTime}
                                                                        onChange={(e) => setTempOption(p => ({ ...p, arrivalTime: e.target.value }))}
                                                                    >
                                                                        <option value="">Select offset</option>
                                                                        <option value="0">At activity start time</option>
                                                                        <option value="15">15 minutes before</option>
                                                                        <option value="30">30 minutes before</option>
                                                                        <option value="45">45 minutes before</option>
                                                                        <option value="60">60 minutes before</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Scenario B: Pickup Service */}
                                                        {tempOption.meetingType === 'pickup' && (
                                                            <div className="space-y-10 pt-6 border-t border-gray-100 animate-fade-in">
                                                                <div className="space-y-6">
                                                                    <p className="text-[16px] font-bold text-[#1A2B49]">Pickup service</p>

                                                                    <div className="space-y-4">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">Where will you pick up your customers?</p>
                                                                        <div className="space-y-4">
                                                                            {['From any address within a specific area', 'From a defined list of pickup locations (hotels, airports, etc.)'].map((opt, i) => (
                                                                                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pickupType === (i === 0 ? 'any' : 'defined') ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                        {tempOption.pickupType === (i === 0 ? 'any' : 'defined') && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                                    </div>
                                                                                    <input type="radio" className="hidden" checked={tempOption.pickupType === (i === 0 ? 'any' : 'defined')} onChange={() => setTempOption(p => ({ ...p, pickupType: (i === 0 ? 'any' : 'defined') }))} />
                                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">{opt}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">When do you pick up your customers?</p>
                                                                        <div className="space-y-4">
                                                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                                                <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pickupTimeType === 'start' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                    {tempOption.pickupTimeType === 'start' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                                </div>
                                                                                <input type="radio" className="hidden" checked={tempOption.pickupTimeType === 'start'} onChange={() => setTempOption(p => ({ ...p, pickupTimeType: 'start' }))} />
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">At the activity start time</span>
                                                                                    <p className="text-[12px] text-gray-500 font-medium">Pickup and activity are at the same time</p>
                                                                                </div>
                                                                            </label>
                                                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                                                <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pickupTimeType === 'before' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                    {tempOption.pickupTimeType === 'before' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                                </div>
                                                                                <input type="radio" className="hidden" checked={tempOption.pickupTimeType === 'before'} onChange={() => setTempOption(p => ({ ...p, pickupTimeType: 'before' }))} />
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">Before the activity starts</span>
                                                                                    <p className="text-[12px] text-gray-500 italic">Example: pickup is at 8:00 AM, activity starts at 9:00 AM</p>
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">When can the customer expect your final pickup confirmation?</p>
                                                                        <p className="text-[13px] text-gray-500 font-medium italic">We'll inform the customer about your suggested pickup details but you're responsible to confirm the exact pickup details to each customer individually.</p>
                                                                        <div className="space-y-4">
                                                                            {['The day before the activity takes place', 'Directly after customer selects pickup location'].map((opt, i) => (
                                                                                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                                                                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pickupConfirmationType === (i === 0 ? 'day_before' : 'after_selection') ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                        {tempOption.pickupConfirmationType === (i === 0 ? 'day_before' : 'after_selection') && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                                    </div>
                                                                                    <input type="radio" className="hidden" checked={tempOption.pickupConfirmationType === (i === 0 ? 'day_before' : 'after_selection')} onChange={() => setTempOption(p => ({ ...p, pickupConfirmationType: (i === 0 ? 'day_before' : 'after_selection') }))} />
                                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">{opt}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">When do you usually pick up your customers?</p>
                                                                        <p className="text-[13px] text-gray-500 font-medium italic font-bold">Note that you'll still need to communicate the exact pickup time for every booking.</p>
                                                                        <select
                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer shadow-sm text-[#1A2B49]"
                                                                            value={tempOption.pickupTimeSlots}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, pickupTimeSlots: e.target.value }))}
                                                                        >
                                                                            <option value="">Choose one...</option>
                                                                            <option value="15-30">15-30 minutes before</option>
                                                                            <option value="30-45">30-45 minutes before</option>
                                                                            <option value="45-60">45-60 minutes before</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">Describe your pickup <span className="text-gray-400 font-normal">(optional)</span></p>
                                                                        <p className="text-[13px] text-gray-500 font-medium italic">What should customers look for when waiting for their vehicle? Where should they wait? If your pickup areas/places are very specific, describe them in more detail.</p>
                                                                        <div className="relative">
                                                                            <textarea
                                                                                className="w-full border border-gray-300 rounded-lg p-4 outline-none focus:border-[#0071EB] text-[15px] font-medium min-h-[120px] shadow-sm"
                                                                                placeholder={`Please insert your text in ${formData.language || 'English'}`}
                                                                                maxLength={1000}
                                                                                value={tempOption.pickupDescription}
                                                                                onChange={(e) => setTempOption(p => ({ ...p, pickupDescription: e.target.value }))}
                                                                            ></textarea>
                                                                            <div className="absolute bottom-3 right-3 text-[12px] text-gray-400 font-bold">{(tempOption.pickupDescription || '').length} / 1000</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Drop-off Section (Common for both) */}
                                                        <div className="space-y-6 pt-10 border-t border-gray-100">
                                                            <p className="text-[16px] font-bold text-[#1A2B49]">Drop-off</p>
                                                            <div className="space-y-4">
                                                                <p className="text-[14px] font-bold text-[#1A2B49]">Where will you drop off the customer at the end of the activity?</p>
                                                                <div className="space-y-4">
                                                                    {[
                                                                        { id: 'same', label: tempOption.meetingType === 'meeting' ? 'At the same place you met them' : 'At the same place you picked them up' },
                                                                        { id: 'different', label: 'At a different place' },
                                                                        { id: 'none', label: 'No drop-off service, the customer stays at the site or destination' }
                                                                    ].map((opt) => (
                                                                        <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
                                                                            <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.dropOffType === opt.id ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                {tempOption.dropOffType === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                            </div>
                                                                            <input type="radio" className="hidden" checked={tempOption.dropOffType === opt.id} onChange={() => setTempOption(p => ({ ...p, dropOffType: opt.id }))} />
                                                                            <span className="text-[15px] font-medium text-[#1A2B49]">{opt.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>

                                                                {/* Conditional UI for 'At a different place' */}
                                                                {tempOption.dropOffType === 'different' && (
                                                                    <div className="space-y-4 pt-4 animate-fade-in pl-8 border-l-2 border-gray-100 ml-[10px]">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">Add drop-off address</p>
                                                                        <div className="flex gap-4 items-center">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setTempAddressInput(tempOption.dropOffAddress || '');
                                                                                    setAddressModalType('dropoff');
                                                                                    setShowAddressModal(true);
                                                                                }}
                                                                                className="px-6 py-2 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-colors shadow-sm bg-white"
                                                                            >
                                                                                Add address
                                                                            </button>
                                                                            {tempOption.dropOffAddress && (
                                                                                <span className="text-[14px] font-medium text-[#1A2B49] bg-gray-50 px-4 py-2 rounded border border-gray-200 shadow-sm max-w-[300px] truncate">
                                                                                    {tempOption.dropOffAddress}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Transportation Section (Only for Pickup) */}
                                                        {tempOption.meetingType === 'pickup' && (
                                                            <div className="space-y-6 pt-10 border-t border-gray-100 animate-fade-in">
                                                                <p className="text-[16px] font-bold text-[#1A2B49]">Transportation</p>
                                                                <div className="space-y-4">
                                                                    <p className="text-[14px] font-bold text-[#1A2B49]">What's the transportation used for pickup and drop-off?</p>
                                                                    <select
                                                                        className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white cursor-pointer shadow-sm text-[#1A2B49]"
                                                                        value={tempOption.transportationType}
                                                                        onChange={(e) => setTempOption(p => ({ ...p, transportationType: e.target.value }))}
                                                                    >
                                                                        <option value="">Select a transportation type</option>
                                                                        <option value="Bus">Bus</option>
                                                                        <option value="Mini-bus">Mini-bus</option>
                                                                        <option value="Car">Car</option>
                                                                        <option value="Van">Van</option>
                                                                        <option value="Boat">Boat</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Step Navigation Bottom */}
                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-12 mt-12">
                                                        <button
                                                            onClick={() => setOptionSubStep('setup')}
                                                            className="w-full sm:w-auto text-center px-8 py-3 rounded-full border-2 border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-all shadow-sm"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveOption(true)}
                                                            className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-medium text-[13px] hover:bg-gray-50 transition-all shadow-sm"
                                                        >
                                                            Save and exit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleSaveOption(false);
                                                                setOptionSubStep('connectivity');
                                                            }}
                                                            className="w-full sm:w-auto px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[13px] hover:bg-blue-700 shadow-sm transition-all active:scale-95 text-center whitespace-nowrap"
                                                        >
                                                            Continue
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Connectivity Settings Step */}
                                            {optionSubStep === 'connectivity' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Connectivity Settings</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>
                                                        <p className="text-[15px] font-medium text-[#1A2B49] leading-relaxed mb-10 max-w-[700px]">
                                                            TravellersDeal supports API integrations with industry-leading channel managers, ticketing and reservation systems, allowing suppliers to manage all of their bookings and availability in one place. <a href="#" className="text-[#0071EB] hover:underline font-bold">Learn more.</a>
                                                        </p>

                                                        <div className="space-y-6 pt-4 animate-fade-in">
                                                            <div className="space-y-1">
                                                                <p className="text-[16px] font-bold text-[#1A2B49]">Do you use an online reservation system?</p>
                                                                <p className="text-[14px] text-gray-600 font-medium">We will use this information to help connect your product/option</p>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <label className="flex items-center gap-3 cursor-pointer group w-full">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.useReservationSystem === false ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.useReservationSystem === false && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.useReservationSystem === false} onChange={() => setTempOption(p => ({ ...p, useReservationSystem: false, reservationSystem: '', externalProductId: '' }))} />
                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">No, I don't</span>
                                                                </label>

                                                                <label className="flex items-center gap-3 cursor-pointer group w-full">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.useReservationSystem === true ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.useReservationSystem === true && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.useReservationSystem === true} onChange={() => setTempOption(p => ({ ...p, useReservationSystem: true }))} />
                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">Yes, I use a reservation system</span>
                                                                </label>
                                                            </div>

                                                            {/* Conditional UI if Reservation System is Yes */}
                                                            {tempOption.useReservationSystem === true && (
                                                                <div className="space-y-6 pt-6 mt-6 border-t border-gray-100 animate-fade-in pl-2">
                                                                    <div className="space-y-2">
                                                                        <p className="text-[14px] font-bold text-[#1A2B49]">Select your Reservation System</p>
                                                                        <select
                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-medium bg-white cursor-pointer shadow-sm text-[#1A2B49]"
                                                                            value={tempOption.reservationSystem || ''}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, reservationSystem: e.target.value }))}
                                                                        >
                                                                            <option value="" disabled>Choose a system...</option>
                                                                            {[
                                                                                'FareHarbor', 'Bokun', 'Rezdy', 'Peek Pro', 'Xola', 'Checkfront',
                                                                                'Regiondo', 'TrekkSoft', 'BookingKit', 'TourCMS', 'Ventrata', 'Palisis',
                                                                                'Anchor', 'Bókun', 'Catalate', 'Easol', 'Eola', 'Experiences', 'Globerovers',
                                                                                'GoKite', 'Prio', 'Prioticket', 'Redeam', 'RocketRez', 'Roller',
                                                                                'TicketingHub', 'TourDesk', 'Trekksoft', 'TripShock', 'TRYND', 'Ventrata (WBE)',
                                                                                'Waldorf', 'Zaui', 'ResPax', 'Secutix', 'Travelotopos', 'Other'
                                                                            ].sort().map(sys => (
                                                                                <option key={sys} value={sys}>{sys}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-[14px] font-bold text-[#1A2B49]">External product ID <span className="text-gray-400 font-normal ml-1"><FaInfoCircle className="inline" /></span></p>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border border-gray-300 rounded-lg p-3.5 outline-none focus:border-[#0071EB] text-[15px] font-medium text-[#1A2B49]"
                                                                            placeholder="GYG_MANAGED"
                                                                            value={tempOption.externalProductId || ''}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, externalProductId: e.target.value }))}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Step Navigation Bottom */}
                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-12 mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setOptionSubStep('meeting'); }}
                                                            className="w-full sm:w-auto text-center px-8 py-3 rounded-full border-2 border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-all shadow-sm mr-auto"
                                                        >
                                                            Back to product
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleSaveOption(false);
                                                                setOptionSubStep('pricing');
                                                            }}
                                                            className="w-full sm:w-auto px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[13px] hover:bg-blue-700 shadow-sm transition-all active:scale-95 text-center whitespace-nowrap"
                                                        >
                                                            Continue
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Setup Step - Initial */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'setup' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-8">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        <div className="space-y-6 animate-fade-in">
                                                            <p className="text-[16px] font-bold text-[#1A2B49]">How do you set your prices?</p>

                                                            <div className="space-y-6">
                                                                <label className="flex items-start gap-3 cursor-pointer group w-full">
                                                                    <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pricingType === 'person' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.pricingType === 'person' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.pricingType === 'person'} onChange={() => setTempOption(p => ({ ...p, pricingType: 'person' }))} />
                                                                    <div>
                                                                        <span className="text-[15px] font-medium text-[#1A2B49] block">Price per person</span>
                                                                        <span className="text-[13px] text-[#1A2B49] font-medium block mt-0.5">Set different prices for adults, youth, child, etc.</span>
                                                                    </div>
                                                                </label>

                                                                <label className="flex items-start gap-3 cursor-pointer group w-full">
                                                                    <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pricingType === 'group' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.pricingType === 'group' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.pricingType === 'group'} onChange={() => setTempOption(p => ({ ...p, pricingType: 'group' }))} />
                                                                    <div>
                                                                        <span className="text-[15px] font-medium text-[#1A2B49] block">Price per group/vehicle</span>
                                                                        <span className="text-[13px] text-[#1A2B49] font-medium block mt-0.5">Set different prices based on group size, vehicle type, etc.</span>
                                                                    </div>
                                                                </label>
                                                            </div>

                                                            <div className="pt-6">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setPricingFlowStep('categories');
                                                                        if (tempOption.pricingTiers.length === 0) {
                                                                            setTempOption(p => ({
                                                                                ...p,
                                                                                pricingTiers: [
                                                                                    { title: 'Child', minAge: 0, maxAge: 17 },
                                                                                    { title: 'Adult', minAge: 18, maxAge: 99 }
                                                                                ]
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="px-6 py-2 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                                                >
                                                                    Add new pricing
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step Navigation Bottom */}
                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-12 mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setOptionSubStep('connectivity'); }}
                                                            className="w-full sm:w-auto text-center px-8 py-3 rounded-full border-2 border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-all shadow-sm mr-auto"
                                                        >
                                                            Back to product
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleSaveOption(false);
                                                                setOptionSubStep('cutoff');
                                                            }}
                                                            className="w-full sm:w-auto px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[13px] hover:bg-blue-700 shadow-sm transition-all active:scale-95 text-center whitespace-nowrap"
                                                        >
                                                            Continue
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Flow Step - Categories */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'categories' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        {/* Stepper Header */}
                                                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold">
                                                                <div className="w-6 h-6 rounded-full bg-[#0071EB] text-white flex items-center justify-center text-[12px]">1</div>
                                                                <span className="text-[14px] border-b-2 border-[#0071EB] pb-2">Pricing Categories</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-300"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">2</div>
                                                                <span className="text-[14px]">Capacity</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">3</div>
                                                                <span className="text-[14px]">Price</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">4</div>
                                                                <span className="text-[14px]">Add-ons <span className="text-gray-400 font-normal">(optional)</span></span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">5</div>
                                                                <span className="text-[14px]">Validate</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8 max-w-[800px]">
                                                            <div className="space-y-4">
                                                                <p className="text-[15px] font-bold text-[#1A2B49]">Tell us more about your prices:</p>
                                                                <label className="flex items-center gap-3 cursor-pointer group w-full">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pricingPersonDependency === 'everyone' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.pricingPersonDependency === 'everyone' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.pricingPersonDependency === 'everyone'} onChange={() => setTempOption(p => {
                                                                        let adultPrice = p.price;
                                                                        if (p.pricingTiers && p.pricingTiers.length > 0) {
                                                                            const adultTier = p.pricingTiers.find(t => t.title.toLowerCase() === 'adult') || p.pricingTiers[0];
                                                                            adultPrice = adultTier.price;
                                                                        }
                                                                        return { ...p, pricingPersonDependency: 'everyone', price: adultPrice };
                                                                    })} />
                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">The price is the same for everyone, eg: per participant</span>
                                                                </label>
                                                                <label className="flex items-center gap-3 cursor-pointer group w-full">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.pricingPersonDependency === 'category' ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                        {tempOption.pricingPersonDependency === 'category' && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                    </div>
                                                                    <input type="radio" className="hidden" checked={tempOption.pricingPersonDependency === 'category'} onChange={() => setTempOption(p => ({ ...p, pricingPersonDependency: 'category' }))} />
                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">Price depends on category, e.g. child, senior, military etc</span>
                                                                </label>
                                                            </div>

                                                            {/* Categories block */}
                                                            {tempOption.pricingPersonDependency === 'category' && (
                                                                <div className="space-y-4 animate-fade-in">
                                                                    <div className="flex items-center justify-between pb-2">
                                                                        <p className="text-[15px] font-bold text-[#1A2B49]">Pricing categories:</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">Show advanced settings</span>
                                                                            <div
                                                                                className={`w-10 h-5 rounded-full cursor-pointer relative shadow-inner border transition-colors ${showAdvancedPricingOptions ? 'bg-[#0071EB] border-[#0071EB]' : 'bg-gray-200 border-gray-300'}`}
                                                                                onClick={() => setShowAdvancedPricingOptions(!showAdvancedPricingOptions)}
                                                                            >
                                                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow transition-all ${showAdvancedPricingOptions ? 'left-5' : 'left-0.5'}`}></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        {tempOption.pricingTiers.length === 0 ? (
                                                                            <p className="text-[14px] text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">No categories added yet.</p>
                                                                        ) : tempOption.pricingTiers.map((tier, idx) => (
                                                                            <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-colors">
                                                                                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-12 justify-between w-full">
                                                                                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-12 w-full sm:w-auto">
                                                                                        <span className="text-[15px] font-bold text-[#1A2B49] min-w-[80px] pt-0.5">{tier.title}</span>
                                                                                        <div className="flex flex-col gap-1.5">
                                                                                            <span className="text-[13px] text-gray-600 font-medium">Age range</span>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <select
                                                                                                    className="border border-gray-300 rounded px-2.5 py-1.5 outline-none text-[14px] font-medium text-[#1A2B49] cursor-pointer focus:border-[#0071EB] hover:border-gray-400 min-w-[70px] shadow-sm"
                                                                                                    value={tier.minAge}
                                                                                                    onChange={(e) => {
                                                                                                        setTempOption(p => ({
                                                                                                            ...p,
                                                                                                            pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, minAge: parseInt(e.target.value) } : t)
                                                                                                        }));
                                                                                                    }}
                                                                                                >
                                                                                                    {Array.from({ length: 100 }, (_, i) => (
                                                                                                        <option key={`min-${i}`} value={i}>{i}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                <span className="text-[14px] font-bold text-[#1A2B49]">to</span>
                                                                                                <select
                                                                                                    className="border border-gray-300 rounded px-2.5 py-1.5 outline-none text-[14px] font-medium text-[#1A2B49] cursor-pointer focus:border-[#0071EB] hover:border-gray-400 min-w-[70px] shadow-sm"
                                                                                                    value={tier.maxAge}
                                                                                                    onChange={(e) => {
                                                                                                        setTempOption(p => ({
                                                                                                            ...p,
                                                                                                            pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, maxAge: parseInt(e.target.value) } : t)
                                                                                                        }));
                                                                                                    }}
                                                                                                >
                                                                                                    {Array.from({ length: 100 }, (_, i) => (
                                                                                                        <option key={`max-${i}`} value={i}>{i}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-12 flex-1 sm:justify-end mt-6 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                                                                                        {showAdvancedPricingOptions && (
                                                                                            <div className="flex flex-col gap-6 pl-0 sm:pl-8">
                                                                                                <span className="text-[14px] font-medium text-[#1A2B49] mb-1 leading-none">Advanced settings</span>

                                                                                                <div className="space-y-3">
                                                                                                    <span className="text-[14px] font-bold text-[#1A2B49]">Is this category permitted?</span>
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.isPermitted !== false ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.isPermitted !== false && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.isPermitted !== false} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, isPermitted: true } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">Yes</span>
                                                                                                        </label>
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.isPermitted === false ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.isPermitted === false && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.isPermitted === false} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, isPermitted: false } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">No</span>
                                                                                                        </label>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-3">
                                                                                                    <span className="text-[14px] font-bold text-[#1A2B49]">Is this category free of charge?</span>
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.isFreeOfCharge === true ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.isFreeOfCharge === true && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.isFreeOfCharge === true} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, isFreeOfCharge: true } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">Yes</span>
                                                                                                        </label>
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.isFreeOfCharge !== true ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.isFreeOfCharge !== true && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.isFreeOfCharge !== true} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, isFreeOfCharge: false } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">No</span>
                                                                                                        </label>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-3">
                                                                                                    <span className="text-[14px] font-bold text-[#1A2B49]">Do they need a ticket for this activity?</span>
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.needsTicket !== false ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.needsTicket !== false && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.needsTicket !== false} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, needsTicket: true } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">Yes</span>
                                                                                                        </label>
                                                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tier.needsTicket === false ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                                                                {tier.needsTicket === false && <div className="w-2 h-2 rounded-full bg-[#0071EB]"></div>}
                                                                                                            </div>
                                                                                                            <input type="radio" className="hidden" checked={tier.needsTicket === false} onChange={() => setTempOption(p => ({ ...p, pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, needsTicket: false } : t) }))} />
                                                                                                            <span className="text-[14px] font-medium text-[#1A2B49]">No</span>
                                                                                                        </label>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                setTempOption(p => ({
                                                                                                    ...p,
                                                                                                    pricingTiers: p.pricingTiers.filter((_, i) => i !== idx)
                                                                                                }));
                                                                                            }}
                                                                                            className="text-[14px] font-medium text-[#D93025] hover:text-red-700 hover:underline px-2"
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="relative inline-block" ref={categoryMenuRef}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                setShowCategoryMenu(!showCategoryMenu);
                                                                            }}
                                                                            className="flex items-center gap-2 text-[#0071EB] font-bold text-[14px] hover:underline pt-2"
                                                                        >
                                                                            Add pricing category <FaChevronDown className="text-[10px]" />
                                                                        </button>
                                                                        {showCategoryMenu && (
                                                                            <div className="absolute left-0 mt-2 w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2">
                                                                                {[
                                                                                    { name: 'Infant', min: 0, max: 3 },
                                                                                    { name: 'Child', min: 4, max: 12 },
                                                                                    { name: 'Youth', min: 13, max: 17 },
                                                                                    { name: 'Senior', min: 65, max: 99 },
                                                                                    { name: 'Student (with ID)', min: 18, max: 35 },
                                                                                    { name: 'Student EU Citizens (with ID)', min: 18, max: 35 },
                                                                                    { name: 'Military (with ID)', min: 18, max: 99 },
                                                                                    { name: 'EU Citizens (with ID)', min: 18, max: 99 }
                                                                                ].map(cat => (
                                                                                    <button
                                                                                        key={cat.name}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            setTempOption(p => ({
                                                                                                ...p,
                                                                                                pricingTiers: [...p.pricingTiers, { title: cat.name, minAge: cat.min, maxAge: cat.max }]
                                                                                            }));
                                                                                            setShowCategoryMenu(false);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-[#1A2B49] hover:bg-gray-50 transition-colors"
                                                                                    >
                                                                                        {cat.name}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPricingFlowStep('setup'); }}
                                                            className="px-4 sm:px-8 py-2.5 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[12px] sm:text-[14px] whitespace-nowrap hover:bg-blue-50 transition-all bg-white mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(false);
                                                                setPricingFlowStep('capacity');
                                                            }}
                                                            disabled={loading}
                                                            className="px-4 sm:px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[12px] sm:text-[13px] whitespace-nowrap hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                                                        >
                                                            {loading ? 'Saving...' : 'Save and continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Flow Step - Capacity */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'capacity' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        {/* Stepper Header */}
                                                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('categories')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Pricing Categories</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold">
                                                                <div className="w-6 h-6 rounded-full bg-[#0071EB] text-white flex items-center justify-center text-[12px]">2</div>
                                                                <span className="text-[14px] border-b-2 border-[#0071EB] pb-2">Capacity</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-300"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">3</div>
                                                                <span className="text-[14px]">Price</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">4</div>
                                                                <span className="text-[14px]">Add-ons <span className="text-gray-400 font-normal">(optional)</span></span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">5</div>
                                                                <span className="text-[14px]">Validate</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 max-w-[800px]">
                                                            <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Maximum capacity</h3>
                                                            <p className="text-[14px] text-gray-500 font-medium">What's the maximum capacity for this pricing option?</p>
                                                            <div className="flex items-center gap-4">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="w-[120px] border border-gray-300 rounded-lg p-3 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white"
                                                                    value={tempOption.capacity}
                                                                    onChange={(e) => setTempOption(p => ({ ...p, capacity: e.target.value }))}
                                                                />
                                                                <span className="text-[15px] font-medium text-[#1A2B49]">people</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPricingFlowStep('categories'); }}
                                                            className="px-4 sm:px-8 py-2.5 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[12px] sm:text-[14px] whitespace-nowrap hover:bg-blue-50 transition-all bg-white mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(false);
                                                                setPricingFlowStep('price');
                                                            }}
                                                            disabled={loading}
                                                            className="px-4 sm:px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[12px] sm:text-[13px] whitespace-nowrap hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                                                        >
                                                            {loading ? 'Saving...' : 'Save and continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Flow Step - Price */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'price' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        {/* Stepper Header */}
                                                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('categories')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Pricing Categories</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('capacity')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Capacity</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold">
                                                                <div className="w-6 h-6 rounded-full bg-[#0071EB] text-white flex items-center justify-center text-[12px]">3</div>
                                                                <span className="text-[14px] border-b-2 border-[#0071EB] pb-2">Price</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-300"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">4</div>
                                                                <span className="text-[14px]">Add-ons <span className="text-gray-400 font-normal">(optional)</span></span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-200"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">5</div>
                                                                <span className="text-[14px]">Validate</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6 max-w-[800px]">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                                                                <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Set your prices</h3>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[14px] font-medium text-[#1A2B49]">Currency:</span>
                                                                    <select
                                                                        className="border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0071EB] text-[14px] font-bold bg-white cursor-pointer"
                                                                        value={tempOption.currency || formData.currency || 'USD'}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setTempOption(p => ({ ...p, currency: val }));
                                                                            setFormData(p => ({ ...p, currency: val }));
                                                                        }}
                                                                    >
                                                                        {globalCurrencies.map(curr => (
                                                                            <option key={curr} value={curr}>{curr}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            {tempOption.pricingPersonDependency === 'everyone' ? (
                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                                    <span className="text-[15px] font-medium text-[#1A2B49]">Price per person:</span>
                                                                    <div className="relative w-full sm:w-auto">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                                                            {{ 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$' }[tempOption.currency || formData.currency || 'USD'] || (tempOption.currency || formData.currency || 'USD')}
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            className="w-full sm:w-[130px] border border-gray-300 rounded-lg p-3 pl-12 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white"
                                                                            value={tempOption.price}
                                                                            onChange={(e) => setTempOption(p => ({ ...p, price: e.target.value }))}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {tempOption.pricingTiers.map((tier, idx) => (
                                                                        <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200 rounded-lg p-4 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                                                            <div>
                                                                                <span className="text-[15px] font-bold text-[#1A2B49] block">{tier.title}</span>
                                                                                <span className="text-[13px] text-gray-500">Age: {tier.minAge} - {tier.maxAge}</span>
                                                                            </div>
                                                                            <div className="relative w-full sm:w-auto">
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                                                                    {{ 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$' }[tempOption.currency || formData.currency || 'USD'] || (tempOption.currency || formData.currency || 'USD')}
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    className="w-full sm:w-[130px] border border-gray-300 rounded-lg p-3 pl-12 outline-none focus:border-[#0071EB] text-[15px] font-bold bg-white"
                                                                                    value={tier.price || ''}
                                                                                    onChange={(e) => {
                                                                                        setTempOption(p => ({
                                                                                            ...p,
                                                                                            pricingTiers: p.pricingTiers.map((t, i) => i === idx ? { ...t, price: e.target.value } : t)
                                                                                        }));
                                                                                    }}
                                                                                    disabled={tier.isFreeOfCharge}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPricingFlowStep('capacity'); }}
                                                            className="px-4 sm:px-8 py-2.5 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[12px] sm:text-[14px] whitespace-nowrap hover:bg-blue-50 transition-all bg-white mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(false);
                                                                setPricingFlowStep('addons');
                                                            }}
                                                            disabled={loading}
                                                            className="px-4 sm:px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[12px] sm:text-[13px] whitespace-nowrap hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                                                        >
                                                            {loading ? 'Saving...' : 'Save and continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Flow Step - Add-ons */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'addons' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        {/* Stepper Header */}
                                                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('categories')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Pricing Categories</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('capacity')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Capacity</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('price')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Price</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold">
                                                                <div className="w-6 h-6 rounded-full bg-[#0071EB] text-white flex items-center justify-center text-[12px]">4</div>
                                                                <span className="text-[14px] border-b-2 border-[#0071EB] pb-2">Add-ons <span className="text-blue-200 font-normal">(optional)</span></span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-gray-300"></div>
                                                            <div className="flex items-center gap-2 text-gray-400 font-medium opacity-60">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px]">5</div>
                                                                <span className="text-[14px]">Validate</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 max-w-[800px]">
                                                            <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Offer optional add-ons</h3>
                                                            <p className="text-[14px] text-gray-500 font-medium">Would you like to offer add-ons such as photo packages or equipment rental?</p>

                                                            {(tempOption.addons || []).map((addon, index) => (
                                                                <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4 bg-white shadow-sm relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            const newAddons = [...(tempOption.addons || [])];
                                                                            newAddons.splice(index, 1);
                                                                            setTempOption({ ...tempOption, addons: newAddons });
                                                                        }}
                                                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pr-8">
                                                                        <div>
                                                                            <label className="block text-[13px] font-bold text-[#1A2B49] mb-1">Add-on Title</label>
                                                                            <input
                                                                                type="text"
                                                                                value={addon.title}
                                                                                onChange={(e) => {
                                                                                    setTempOption(p => ({
                                                                                        ...p,
                                                                                        addons: (p.addons || []).map((a, i) => i === index ? { ...a, title: e.target.value } : a)
                                                                                    }));
                                                                                }}
                                                                                placeholder="e.g. Photo Package"
                                                                                className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-[#0071EB] outline-none"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[13px] font-bold text-[#1A2B49] mb-1">Price</label>
                                                                            <div className="relative">
                                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                                    <span className="text-gray-500 text-sm">{tempOption.currency || 'USD'}</span>
                                                                                </div>
                                                                                <input
                                                                                    type="number"
                                                                                    value={addon.price}
                                                                                    onChange={(e) => {
                                                                                        setTempOption(p => ({
                                                                                            ...p,
                                                                                            addons: (p.addons || []).map((a, i) => i === index ? { ...a, price: e.target.value } : a)
                                                                                        }));
                                                                                    }}
                                                                                    placeholder="0.00"
                                                                                    className="w-full border border-gray-300 rounded-md p-2.5 pl-12 text-sm focus:ring-2 focus:ring-[#0071EB] outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[13px] font-bold text-[#1A2B49] mb-1">Description (optional)</label>
                                                                        <textarea
                                                                            value={addon.description}
                                                                            onChange={(e) => {
                                                                                setTempOption(p => ({
                                                                                    ...p,
                                                                                    addons: (p.addons || []).map((a, i) => i === index ? { ...a, description: e.target.value } : a)
                                                                                }));
                                                                            }}
                                                                            placeholder="Describe what is included in this add-on..."
                                                                            rows="2"
                                                                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-[#0071EB] outline-none resize-none"
                                                                        ></textarea>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setTempOption({
                                                                        ...tempOption,
                                                                        addons: [...(tempOption.addons || []), { title: '', price: '', description: '' }]
                                                                    });
                                                                }}
                                                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-[#0071EB] font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <span className="text-xl leading-none">+</span> Add an optional add-on
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPricingFlowStep('price'); }}
                                                            className="px-4 sm:px-8 py-2.5 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[12px] sm:text-[14px] whitespace-nowrap hover:bg-blue-50 transition-all bg-white mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(false);
                                                                setPricingFlowStep('validate');
                                                            }}
                                                            disabled={loading}
                                                            className="px-4 sm:px-7 py-2 rounded-full bg-[#0071EB] text-white font-medium text-[12px] sm:text-[13px] whitespace-nowrap hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                                                        >
                                                            {loading ? 'Saving...' : 'Save and continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing Flow Step - Validate */}
                                            {optionSubStep === 'pricing' && pricingFlowStep === 'validate' && (
                                                <div className="animate-fade-in text-left flex flex-col h-full min-h-[250px]">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Availability & Pricing</h2>
                                                            <FaInfoCircle className="text-[#0071EB] text-[18px] cursor-help" />
                                                        </div>

                                                        {/* Stepper Header */}
                                                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('categories')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Pricing Categories</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('capacity')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Capacity</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('price')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Price</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold cursor-pointer" onClick={() => setPricingFlowStep('addons')}>
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0071EB] flex items-center justify-center text-[12px]"><FaCheck size={10} /></div>
                                                                <span className="text-[14px]">Add-ons</span>
                                                            </div>
                                                            <div className="w-8 h-[1px] bg-[#0071EB]"></div>
                                                            <div className="flex items-center gap-2 text-[#0071EB] font-bold">
                                                                <div className="w-6 h-6 rounded-full bg-[#0071EB] text-white flex items-center justify-center text-[12px]">5</div>
                                                                <span className="text-[14px] border-b-2 border-[#0071EB] pb-2">Validate</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6 max-w-[800px]">
                                                            <h3 className="text-[18px] font-bold text-[#1A2B49] tracking-tight">Review your pricing setup</h3>
                                                            <div className="p-6 border border-green-200 bg-green-50 rounded-lg text-left">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <FaCheckCircle className="text-[#00A651] text-xl" />
                                                                    <h4 className="text-[16px] font-bold text-[#1A2B49]">Pricing Validated</h4>
                                                                </div>
                                                                <p className="text-[14px] text-gray-700 font-medium">Your pricing configuration is valid. You can now proceed to the next step.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setPricingFlowStep('addons'); }}
                                                            className="px-4 sm:px-8 py-2.5 rounded-full border border-[#0071EB] text-[#0071EB] font-bold text-[12px] sm:text-[14px] whitespace-nowrap hover:bg-blue-50 transition-all bg-white mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(false);
                                                                setOptionSubStep('cutoff');
                                                            }}
                                                            disabled={loading}
                                                            className="px-7 py-2 rounded-full bg-[#00A651] text-white font-medium text-[13px] hover:bg-green-700 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                                                        >
                                                            {loading ? 'Saving...' : 'Validate and continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cut-off Step */}
                                            {optionSubStep === 'cutoff' && (
                                                <div className="animate-fade-in text-left">
                                                    <div className="flex items-center gap-2 mb-8">
                                                        <h2 className="text-[24px] font-bold text-[#1A2B49] tracking-tight">Cut-off time</h2>
                                                    </div>
                                                    <p className="text-[15px] font-medium text-[#1A2B49] leading-relaxed mb-8 max-w-[700px]">
                                                        The cut-off time is the latest time a customer can book before the activity starts. After this time, no new bookings will be accepted for that time slot.
                                                    </p>

                                                    <div className="space-y-6 max-w-[500px]">
                                                        <div className="space-y-3">
                                                            <p className="text-[15px] font-bold text-[#1A2B49]">Booking cut-off</p>
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="168"
                                                                    className="w-[100px] border border-gray-300 rounded-lg p-3 outline-none focus:border-[#0071EB] text-[16px] font-bold text-[#1A2B49] text-center"
                                                                    value={tempOption.cutoffHours ?? 24}
                                                                    onChange={(e) => setTempOption(p => ({ ...p, cutoffHours: Number(e.target.value) }))}
                                                                />
                                                                <span className="text-[15px] font-medium text-[#1A2B49]">hours before activity starts</span>
                                                            </div>
                                                            <p className="text-[13px] text-gray-500 font-medium">Set to 0 for no cut-off (bookings accepted until activity starts).</p>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-[15px] font-bold text-[#1A2B49]">Cancellation policy</p>
                                                            <div className="space-y-3">
                                                                {[
                                                                    { id: 'free_24h', label: 'Free cancellation up to 24 hours before' },
                                                                    { id: 'free_48h', label: 'Free cancellation up to 48 hours before' },
                                                                    { id: 'non_refundable', label: 'Non-refundable' },
                                                                    { id: 'custom', label: 'Custom policy' }
                                                                ].map(opt => (
                                                                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${tempOption.cancellationPolicy === opt.id ? 'border-[#0071EB]' : 'border-gray-300'}`}>
                                                                            {tempOption.cancellationPolicy === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0071EB]"></div>}
                                                                        </div>
                                                                        <input type="radio" className="hidden" checked={tempOption.cancellationPolicy === opt.id} onChange={() => setTempOption(p => ({ ...p, cancellationPolicy: opt.id }))} />
                                                                        <span className="text-[15px] font-medium text-[#1A2B49]">{opt.label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-12 mt-12">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setOptionSubStep('pricing'); }}
                                                            className="w-full sm:w-auto text-center px-8 py-3 rounded-full border-2 border-[#0071EB] text-[#0071EB] font-bold text-[14px] hover:bg-blue-50 transition-all shadow-sm mr-auto"
                                                        >
                                                            Back
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                await handleSaveOption(true);
                                                            }}
                                                            disabled={loading}
                                                            className="px-7 py-2.5 rounded-full bg-[#00A651] text-white font-bold text-[14px] hover:bg-green-700 shadow-sm transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                                                        >
                                                            {loading ? 'Saving...' : '✓ Finish & Save Option'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>


                            </div>
                        )}

                        {subStep === 'itinerary' && (
                            <div className="animate-fade-in relative pb-20 max-w-[700px] text-left">
                                <h1 className="text-[28px] font-bold text-[#1A2B49] mb-4 tracking-tight leading-tight">
                                    Itinerary Builder
                                </h1>
                                <p className="text-[15px] text-gray-600 mb-8 font-medium leading-relaxed">
                                    Add the stops, locations, and details that make up this experience.
                                </p>

                                <div className="space-y-4 mb-6">
                                    {(formData.itinerary || []).map((stop, index) => (
                                        <div key={index} className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm relative group">
                                            <button
                                                onClick={() => handleRemoveItineraryStop(index)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Remove stop"
                                            >
                                                <FaTrash />
                                            </button>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-primary font-bold flex items-center justify-center shrink-0">
                                                    {index + 1}
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-lg">Stop {index + 1}</h4>
                                            </div>

                                            <div className="space-y-4 pl-11">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title / Location Name</label>
                                                    <input
                                                        type="text"
                                                        value={stop.title}
                                                        onChange={(e) => {
                                                            handleItineraryChange(index, 'title', e.target.value);
                                                            if (activeMapStopIndex !== index) setActiveMapStopIndex(index);
                                                        }}
                                                        className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:border-[#0071EB] focus:ring-1 focus:ring-[#0071EB] outline-none transition-all text-sm"
                                                        placeholder="e.g. Ganges River"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Activity Type</label>
                                                    <input
                                                        type="text"
                                                        value={stop.description}
                                                        onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                                                        className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:border-[#0071EB] focus:ring-1 focus:ring-[#0071EB] outline-none transition-all text-sm"
                                                        placeholder="e.g. Boat cruise, Sightseeing"
                                                    />
                                                </div>
                                                <div className="pt-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-semibold text-gray-700">Location (Map)</label>
                                                        {stop.location && stop.location.lat && (
                                                            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Location saved</span>
                                                        )}
                                                    </div>
                                                    
                                                    {activeMapStopIndex === index ? (
                                                        <div className="w-full h-[300px] border border-gray-300 rounded-xl overflow-hidden relative">
                                                            <div className="absolute top-2 right-2 z-[1000] bg-white rounded-md shadow-md p-1 cursor-pointer" onClick={() => setActiveMapStopIndex(null)}>
                                                                <FaTimes className="text-red-500" />
                                                            </div>
                                                            <div className="absolute top-2 left-2 z-[1000] bg-white rounded-md shadow-md px-3 py-1 text-xs font-bold text-gray-600">
                                                                Click anywhere on the map to set pin
                                                            </div>
                                                            <MapContainer center={stop.location?.lat ? [stop.location.lat, stop.location.lng] : [20.5937, 78.9629]} zoom={stop.location?.lat ? 10 : 4} style={{ width: '100%', height: '100%' }}>
                                                                <TileLayer
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                {!stop.location?.lat && <AutoSearchLocation searchTitle={stop.title} />}
                                                                <LocationPicker 
                                                                    position={stop.location?.lat ? [stop.location.lat, stop.location.lng] : null} 
                                                                    setPosition={(pos) => handleItineraryChange(index, 'location', { lat: pos.lat, lng: pos.lng })} 
                                                                />
                                                            </MapContainer>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.preventDefault(); setActiveMapStopIndex(index); }}
                                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                                        >
                                                            <FaMapMarkerAlt className={stop.location?.lat ? "text-[#0071EB]" : "text-gray-400"} />
                                                            {stop.location?.lat ? 'Edit Location on Map' : 'Pick Location on Map'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAddItineraryStop}
                                    className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-[#0071EB] text-[#0071EB] rounded-xl font-bold hover:bg-blue-50 transition-colors"
                                >
                                    + Add an itinerary stop
                                </button>

                                {/* Navigation footer */}
                                <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12 border-t border-gray-100">
                                    <button className="h-9 px-6 rounded-full font-medium text-[13px] border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all hover:px-7 mr-auto" onClick={() => { setSubStep('options'); window.scrollTo(0, 0); }}>Back</button>
                                    
                                    {(formData.itinerary || []).some(stop => !stop.location?.lat) ? (
                                        <div className="text-red-500 text-sm font-bold flex items-center mr-2">Please pick a location on the map for all stops</div>
                                    ) : null}
                                    
                                    <button 
                                        className={`h-9 px-6 rounded-full font-medium text-[13px] border transition-all ${((formData.itinerary || []).some(stop => !stop.location?.lat)) ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' : 'border-[#0071EB] text-[#0071EB] hover:bg-blue-50 hover:px-7'}`}
                                        disabled={(formData.itinerary || []).some(stop => !stop.location?.lat)}
                                        onClick={() => handleSaveProgress(true)}
                                    >
                                        Save and exit
                                    </button>
                                    
                                    <button 
                                        className={`h-9 px-7 rounded-full font-medium text-[13px] shadow-md transition-all ${((formData.itinerary || []).some(stop => !stop.location?.lat)) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#0071EB] text-white hover:bg-blue-700 hover:px-8'}`} 
                                        disabled={loading || (formData.itinerary || []).some(stop => !stop.location?.lat)}
                                        onClick={async () => { 
                                            const success = await handleSaveProgress(); 
                                            if (success) { setSubStep('verify'); window.scrollTo(0, 0); } 
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {subStep === 'verify' && (
                            <div className="animate-fade-in relative pb-20 max-w-[700px] text-left">
                                <h1 className="text-[28px] font-bold text-[#1A2B49] mb-4 tracking-tight leading-tight">
                                    Next step: verify your business details
                                </h1>
                                <p className="text-[15px] text-gray-600 mb-8 font-medium leading-relaxed">
                                    You’re almost done! Your product is all set up, but before you can publish we need you to verify your business details.
                                </p>

                                <div className="space-y-6 mb-12">
                                    {/* Item 1 */}
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full border border-gray-900 text-gray-900 flex items-center justify-center shrink-0">
                                            <span className="text-[12px] font-bold">✓</span>
                                        </div>
                                        <div>
                                            <h3 className="text-[17px] font-bold text-[#1A2B49] mb-1">Build Trust with Travelers</h3>
                                            <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                                                Verified details assure travelers of your authenticity, increasing their confidence to book with you.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Item 2 */}
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full border border-gray-900 text-gray-900 flex items-center justify-center shrink-0">
                                            <span className="text-[12px] font-bold">🔒</span>
                                        </div>
                                        <div>
                                            <h3 className="text-[17px] font-bold text-[#1A2B49] mb-1">Protect Your Business</h3>
                                            <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                                                Secure your accounts from copy-cats and ensure your business's integrity.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation footer */}
                                <div className="flex flex-wrap sm:flex-nowrap justify-end gap-3 sm:gap-4 pt-6 mt-8 sm:pt-10 sm:mt-12">
                                    <button
                                        className="h-9 px-6 rounded-full font-medium text-[13px] border border-[#0071EB] text-[#0071EB] hover:bg-blue-50 transition-all hover:px-7 mr-auto"
                                        onClick={() => handleSaveProgress(true)}
                                    >
                                        Save and exit
                                    </button>
                                    <button
                                        className="h-9 px-7 rounded-full font-medium text-[13px] bg-[#0071EB] text-white hover:bg-blue-700 transition-all shadow-md active:scale-95 hover:px-8"
                                        onClick={() => setShowVerifyModal(true)}
                                    >
                                        Verify details
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Persona Business Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-[460px] overflow-hidden shadow-2xl flex flex-col relative max-h-[95vh] animate-pop-in">
                        {/* Header with Title and Close X Button */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-[20px] font-bold text-[#1A2B49] tracking-tight">Verify your business details</h3>
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-6 text-left">
                            {/* Item 1 */}
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-6 h-6 rounded-full border border-gray-900 text-gray-900 flex items-center justify-center shrink-0">
                                    <span className="text-[12px] font-bold">✓</span>
                                </div>
                                <div>
                                    <h4 className="text-[16px] font-bold text-[#1A2B49] mb-1">Build Trust with Travelers</h4>
                                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                        Verified details assure travelers of your authenticity, increasing their confidence to book with you.
                                    </p>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-6 h-6 rounded-full border border-gray-900 text-gray-900 flex items-center justify-center shrink-0">
                                    <span className="text-[12px] font-bold">🔒</span>
                                </div>
                                <div>
                                    <h4 className="text-[16px] font-bold text-[#1A2B49] mb-1">Protect Your Business</h4>
                                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                        Secure your accounts from copy-cats and ensure your business's integrity.
                                    </p>
                                </div>
                            </div>

                            {/* Disclaimer Paragraph */}
                            <p className="text-[12px] text-gray-500 font-medium leading-relaxed pt-4 border-t border-gray-100">
                                By clicking 'Begin verifying,' you consent to the processing of your biometrics and other information by GetYourGuide Deutschland GmbH as well as Persona and its service providers for identity verification and fraud prevention. Your biometric information will be stored for no more than 3 years. For details on how your data is used and stored, please refer to our <a href="#" className="text-[#0071EB] hover:underline font-bold" onClick={(e) => e.preventDefault()}>Privacy Policy</a>. To learn more about Persona, visit Persona’s website <a href="#" className="text-[#0071EB] hover:underline font-bold" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
                            </p>

                            {/* Begin Verifying Button */}
                            <div className="pt-2">
                                <button
                                    onClick={async () => {
                                        setShowVerifyModal(false);
                                        const success = await handleSaveProgress();
                                        if (success) {
                                            alert("Business details successfully submitted for verification! Your listing will go live after admin review.");
                                            navigate('/vendor/dashboard');
                                        }
                                    }}
                                    className="w-full bg-[#0071EB] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-full transition-all text-[14px] shadow-md active:scale-[0.98]"
                                >
                                    Begin verifying
                                </button>
                            </div>
                        </div>

                        {/* Footer (🌐 English ▾ & SECURED WITH persona) */}
                        {/* <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-gray-500 text-[12px] font-bold">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 select-none">
                                <span>🌐</span>
                                <span>English</span>
                                <span className="text-[9px]">▼</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-80">
                                <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400">Secured With</span>
                                <span className="font-extrabold text-[#1A2B49] text-[13px] tracking-tight">✱ persona</span>
                            </div>
                        </div> */}
                    </div>
                </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-[650px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-[20px] font-bold text-[#1A2B49]">{addressModalType === 'dropoff' ? 'Add drop-off address' : 'Add meeting point address'}</h3>
                            <button
                                onClick={(e) => { e.preventDefault(); setShowAddressModal(false); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <p className="text-[14px] text-[#1A2B49] font-medium text-center px-4 leading-relaxed">
                                This is where customers can come and find you to start the activity. To make it as specific as possible, zoom in and drag the pin to the right place.
                            </p>

                            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:border-[#0071EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <input
                                    type="text"
                                    placeholder="Search location"
                                    className="flex-1 p-3.5 outline-none text-[15px] font-medium text-[#1A2B49]"
                                    value={tempAddressInput}
                                    onChange={(e) => setTempAddressInput(e.target.value)}
                                />
                                <button className="bg-[#4698F5] text-white px-5 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <FaSearch size={14} />
                                </button>
                            </div>

                            <div className="w-full h-[300px] rounded-lg overflow-hidden border border-gray-200 bg-[#E5E3DF] relative">
                                {/* Embedded interactive Google Map placeholder based on input search */}
                                <iframe
                                    title="map-placeholder"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(tempAddressInput || 'Varanasi')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                ></iframe>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
                            <button
                                onClick={(e) => { e.preventDefault(); setShowAddressModal(false); }}
                                className="px-6 py-2.5 rounded-full font-bold text-[14px] text-[#0071EB] hover:bg-blue-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (addressModalType === 'dropoff') {
                                        setTempOption(p => ({ ...p, dropOffAddress: tempAddressInput }));
                                    } else {
                                        setTempOption(p => ({ ...p, meetingAddress: tempAddressInput }));
                                    }
                                    setShowAddressModal(false);
                                }}
                                className={`px-8 py-2.5 rounded-full font-bold text-[14px] shadow-sm transition-colors ${tempAddressInput ? 'bg-[#4698F5] text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                Save address
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pop-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .custom-scrollbar::-webkit-scrollbar { display: none; width: 0px; height: 0px; }
                .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default AddExperience;
