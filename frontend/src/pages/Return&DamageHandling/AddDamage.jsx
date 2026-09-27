import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../component/DamageHandling/Stepper.jsx';
import FormStep1 from '../../component/DamageHandling/FormStep1.jsx';
import FormStep2 from '../../component/DamageHandling/FormStep2.jsx';
import FormStep3 from '../../component/DamageHandling/FormStep3.jsx';
import ReviewModal from '../../component/DamageHandling/ReviewModal.jsx';

function AddDamage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    damageType: '',
    actionRequired: '',
    supplierName: '',
    description: '',
    date: '',
    reportedBy: '',
    productName: '', // Added
    brandName: '',   // Added
  });
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const handleNext = () => {
    console.log(`AddDamage: Moving to step ${currentStep + 1}`);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    console.log(`AddDamage: Moving back to step ${currentStep - 1}`);
    setCurrentStep(currentStep - 1);
  };

  const handleReview = () => {
    console.log('AddDamage: Showing review modal');
    setShowModal(true);
  };

  const handleEdit = () => {
    console.log('AddDamage: Editing - returning to step 1');
    setShowModal(false);
    setCurrentStep(1);
  };

  const handleConfirm = async () => {
    console.log('AddDamage: Confirming submission');
    setShowModal(false);
    setSubmissionError(null);

    const dataToSubmit = {
      itemName: formData.itemName,
      quantity: Number(formData.quantity),
      damageType: formData.damageType,
      actionRequired: formData.actionRequired,
      supplierName: formData.supplierName,
      description: formData.description,
      date: formData.date,
      reportedBy: formData.reportedBy,
      productName: formData.productName, // Added
      brandName: formData.brandName,    // Added
    };

    console.log('AddDamage: Data to submit:', dataToSubmit);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to submit a damage report');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE_URL}/returns/add-damage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit damage report');
      }

      const result = await res.json();
      console.log('Damage report submitted:', result);

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setCurrentStep(1);
        setFormData({
          itemName: '',
          quantity: '',
          damageType: '',
          actionRequired: '',
          supplierName: '',
          description: '',
          date: '',
          reportedBy: '',
          productName: '',
          brandName: '',
        });
        console.log('AddDamage: Reset after submission');
      }, 2000);
    } catch (err) {
      setSubmissionError(err.message || 'An error occurred while submitting');
      console.error('Error submitting damage report:', err);
      if (err.message.includes('Invalid or expired token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      }
    }
  };

  console.log(`AddDamage: Rendering with currentStep = ${currentStep}`);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Add New Damage</h1>
      {!isSubmitted && (
        <>
          <Stepper currentStep={currentStep} />
          {submissionError && (
            <div className="max-w-lg mx-auto bg-red-100 p-4 rounded-lg shadow-lg text-center mb-4">
              <p className="text-red-600">{submissionError}</p>
            </div>
          )}
          {currentStep === 1 && (
            <FormStep1
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {currentStep === 2 && (
            <FormStep2
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {currentStep === 3 && (
            <FormStep3
              formData={formData}
              setFormData={setFormData}
              onBack={handleBack}
              onReview={handleReview}
            />
          )}
        </>
      )}
      {showModal && (
        <ReviewModal
          formData={formData}
          onEdit={handleEdit}
          onConfirm={handleConfirm}
        />
      )}
      {isSubmitted && (
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-green-600">Success!</h2>
          <p className="text-gray-600 mt-2">Damage report submitted successfully.</p>
        </div>
      )}
    </div>
  );
}

export default AddDamage;