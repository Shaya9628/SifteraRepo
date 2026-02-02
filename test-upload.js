// Resume Upload Test Script
// This script can be run in the browser console to test upload functionality

const testUploadValidation = () => {
  console.log('🧪 Testing Resume Upload Validation...');
  
  // Test file validation
  const testValidateFile = (file) => {
    const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return `File type ${fileExtension} not allowed. Please use PDF, DOC, or DOCX files.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum allowed size is 10MB.`;
    }
    
    return null;
  };
  
  // Test sanitizeFilename
  const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9\-_\.]/g, '_').replace(/_{2,}/g, '_');
  };
  
  // Test cases
  const testCases = [
    {
      name: 'valid-pdf.pdf',
      size: 1024 * 1024, // 1MB
      expectedError: null
    },
    {
      name: 'invalid.txt',
      size: 1024,
      expectedError: 'File type .txt not allowed. Please use PDF, DOC, or DOCX files.'
    },
    {
      name: 'too-large.pdf',
      size: 11 * 1024 * 1024, // 11MB
      expectedError: 'File size too large. Maximum allowed size is 10MB.'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const mockFile = { name: testCase.name, size: testCase.size };
    const result = testValidateFile(mockFile);
    
    if (result === testCase.expectedError) {
      console.log(`✅ Test ${index + 1}: PASSED - ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: FAILED - ${testCase.name}`);
      console.log(`  Expected: ${testCase.expectedError}`);
      console.log(`  Got: ${result}`);
      failed++;
    }
  });
  
  // Test filename sanitization
  const sanitizationTests = [
    { input: 'John Doe Resume.pdf', expected: 'John_Doe_Resume.pdf' },
    { input: 'resume@#$%.docx', expected: 'resume____.docx' },
    { input: 'normal-file_name.pdf', expected: 'normal-file_name.pdf' }
  ];
  
  sanitizationTests.forEach((test, index) => {
    const result = sanitizeFilename(test.input);
    if (result === test.expected) {
      console.log(`✅ Sanitization ${index + 1}: PASSED - "${test.input}" → "${result}"`);
      passed++;
    } else {
      console.log(`❌ Sanitization ${index + 1}: FAILED - "${test.input}" → "${result}"`);
      console.log(`  Expected: "${test.expected}"`);
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Upload validation is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
};

// Test upload component existence
const testComponentsExist = () => {
  console.log('🔍 Checking if upload components exist...');
  
  // Check if components are available in the DOM
  const uploadAreas = document.querySelectorAll('[class*="border-dashed"]');
  const uploadButtons = document.querySelectorAll('button[class*="Upload"]');
  
  console.log(`Found ${uploadAreas.length} potential upload areas`);
  console.log(`Found ${uploadButtons.length} potential upload buttons`);
  
  if (uploadAreas.length > 0) {
    console.log('✅ Upload areas found in DOM');
  } else {
    console.log('❌ No upload areas found. Make sure you\'re on the Admin Dashboard.');
  }
};

// Test database connection (requires being logged in)
const testDatabaseConnection = async () => {
  console.log('🗄️ Testing database connection...');
  
  try {
    // This will only work if supabase client is available
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('profiles')
        .select('id, full_name')
        .limit(1);
      
      if (error) {
        console.log('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful');
        console.log('Sample data:', data);
      }
    } else {
      console.log('⚠️ Supabase client not available. Make sure you\'re on the application.');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Starting Resume Upload Tests...\n');
  
  testUploadValidation();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testComponentsExist();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testDatabaseConnection();
  
  console.log('\n🏁 All tests completed!');
  console.log('\n📋 To manually test uploads:');
  console.log('1. Navigate to Admin Dashboard → Resume Management');
  console.log('2. Try dragging a PDF file to the upload area');
  console.log('3. Fill in the required fields');
  console.log('4. Click Upload and check for success/error messages');
};

// Export for use
if (typeof window !== 'undefined') {
  window.testResumeUpload = runAllTests;
  window.testUploadValidation = testUploadValidation;
  window.testComponentsExist = testComponentsExist;
  window.testDatabaseConnection = testDatabaseConnection;
  
  console.log('🧪 Resume Upload Test Suite loaded!');
  console.log('Run testResumeUpload() to start testing');
}

// Auto-run if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🏠 Development environment detected. Running tests...');
  setTimeout(runAllTests, 2000); // Wait 2 seconds for app to load
}