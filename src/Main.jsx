import React, { useState, useEffect } from "react";
import image12 from './component/image.png'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  Heading,
  useToast,
  Select as ChakraSelect,
  Text,
  Container,
  Card,
  CardBody,
  CardHeader,
  Stack,
  InputGroup,
  Icon,
  InputLeftAddon,
  Image,
  Flex,
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon, StarIcon } from "@chakra-ui/icons";
import Select from "react-select";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const initialState = {
  serialNo: "",
  name: "",
  whatsappNumber: "",
  email: "",
  gender: "",
  collegeOrWorking: "",
  companyName: "",
  college: "",
  course: "",
  year: "",
  dob: "",
  slot: "",
  amount: "49.00",
};

const slotOptions = [
  { value: "Morning", label: "Morning (11AM - 1PM)" },
  { value: "Evening", label: "Evening (5PM - 7PM)" }
];

const Main = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await axios.get(
          "https://vrc-server-110406681774.asia-south1.run.app/college"
        );
        const options = res.data.map((college) => ({
          label: college.name,
          value: college.name,
        }));
        setCollegeOptions(options);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    };
    fetchColleges();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const {
      name,
      whatsappNumber,
      email,
      gender,
      collegeOrWorking,
      companyName,
      college,
      course,
      year,
      dob,
      slot,
    } = formData;

    if (!name.trim()) newErrors.name = "Name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      newErrors.whatsappNumber = "Enter a valid 10-digit number";
    }
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email";
    if (!gender) newErrors.gender = "Please select gender";
    if (!collegeOrWorking)
      newErrors.collegeOrWorking = "Please select one option";
    if (collegeOrWorking === "Working" && !companyName.trim())
      newErrors.companyName = "Company name is required";
    if (collegeOrWorking === "College" && !college.trim()) newErrors.college = "College name is required";
    if (collegeOrWorking === "College" && !course.trim()) newErrors.course = "Course is required";
    if (collegeOrWorking === "College" && !year)
      newErrors.year = "Year is required";
    if (!slot) newErrors.slot = "Please select your slot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const orderRes = await fetch(
        "https://vrc-server-110406681774.asia-south1.run.app/api/create-order",
        // "http://localhost:3300/api/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 4900 }),
        }
      );
      const orderData = await orderRes.json();
      if (!orderData.id) throw new Error("Order creation failed");

      const options = {
        key: "rzp_live_HBAc3tlMK0X5Xd",
        amount: orderData.amount,
        currency: "INR",
        name: "Krishna Pulse Youth Fest",
        description: "Registration Fee",
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(
              "https://vrc-server-110406681774.asia-south1.run.app/api/verify-payment",
              // "http://localhost:3300/api/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  formData: {
                    ...formData,
                    paymentMethod: "Online",
                    receipt: `receipt_${Date.now()}`,
                  },
                }),
              }
            );
            const result = await verifyRes.json();
            if (result.message === "success") {
              toast({
                title: "Registration Successful!",
                description: "Your registration is confirmed.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
              });
              navigate(`/thankyou/${response.razorpay_payment_id}`);
            } else {
              throw new Error(result.message);
            }
          } catch (err) {
            toast({
              title: "Payment verification failed",
              description: err.message || "Try again later",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: `91${formData.whatsappNumber}`,
        },
        theme: { color: "#0a9396" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast({
        title: "Payment failed",
        description: err.message || "Try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#E2E8F0",
      borderWidth: "2px",
      borderRadius: "6px",
      minHeight: "40px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      "&:hover": { borderColor: "#CBD5E0" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3182CE"
        : state.isFocused
        ? "#EBF8FF"
        : "white",
      color: state.isSelected ? "white" : "#2D3748",
    }),
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="2xl" px={4}>
        {/* Header */}
        <Flex
          direction="row"
          align="center"
          justify="center"
          gap={6}
          mb={8}
          textAlign="left"
          flexWrap="wrap"
        >
          {/* Logo */}
          <Box
            boxSize={{ base: '120px', md: '150px' }}
            borderRadius="full"
            overflow="hidden"
            shadow="md"
            border="2px solid #ccc"
            flexShrink={0}
          >
            <Image
              src={image12}
              alt="Krishna Pulse Logo"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
          {/* Title and Tagline */}
          <Box>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color="black" fontWeight="bold">
              KRISHNA PULSE  <br /> YOUTH FESTIVAL
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.700" fontWeight="semibold" mt={2}>
              A Fest of Fun, Faith & Freedom
            </Text>
          </Box>
        </Flex>
        {/* Banner */}
        {/*<Box mb={8} bgGradient="linear(to-r, teal.600, gold.500)" color="white" p={4} borderRadius="lg" textAlign="center">*/
          <HStack spacing={2} justify="center">
            {/* <Icon as={StarIcon} /> */}
            <Text fontWeight="semibold" color={"black"}>5 LIFE CHANGING LESSONS FROM BHAGAVATGITA </Text>
            <Icon as={StarIcon} />
          </HStack>
         /* <Text mt={2} fontSize="sm" color={"black"}>
            Register before August 10th and get exclusive Krishna Pulse merchandise! Limited seats available.
          </Text> */
        /*</Box>*/ }
        {/* Features */}
        <HStack spacing={6} mb={8} justify="center">
          <VStack>
            <Box w={12} h={12} bg="gold.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
              <CalendarIcon color="gold.600" boxSize={6} />
            </Box>
            <Text fontSize="sm" fontWeight="medium">Cultural Events</Text>
          </VStack>
          <VStack>
            <Box w={12} h={12} bg="teal.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="2xl">👥</Text>
            </Box>
            <Text fontSize="sm" fontWeight="medium">Youth Connect</Text>
          </VStack>
          <VStack>
            <Box w={12} h={12} bg="orange.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
              <TimeIcon color="orange.600" boxSize={6} />
            </Box>
            <Text fontSize="sm" fontWeight="medium">2 Hours Event</Text>
          </VStack>
        </HStack>
        {/* Form */}
        <Card boxShadow="xl" borderRadius="2xl">
          <CardHeader textAlign="center">
            <Heading size="lg">Registration Form</Heading>
            <Text color="gray.600" mt={2}>
              <Text as="span" color="red.500">*</Text> indicates required
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Name <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "teal.500" }}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.dob}>
                <FormLabel>Date of Birth <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "teal.500" }}
                />
                <FormErrorMessage>{errors.dob}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.whatsappNumber}>
                <FormLabel>WhatsApp Number <Text as="span" color="red.500">*</Text></FormLabel>
                <InputGroup>
                  <InputLeftAddon bg="gray.50">+91</InputLeftAddon>
                  <Input
                    type="tel"
                    placeholder="Your WhatsApp number"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "teal.500" }}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.whatsappNumber}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email <Text as="span" color="red.500">*</Text></FormLabel>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "teal.500" }}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.gender}>
                <FormLabel>Gender <Text as="span" color="red.500">*</Text></FormLabel>
                <RadioGroup value={formData.gender} onChange={(val) => handleInputChange("gender", val)}>
                  <HStack spacing={6}>
                    <Radio value="Male" colorScheme="teal">Male</Radio>
                    <Radio value="Female" colorScheme="teal">Female</Radio>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{errors.gender}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.collegeOrWorking}>
                <FormLabel>College / WorkingProfessional <Text as="span" color="red.500">*</Text></FormLabel>
                <ChakraSelect
                  value={formData.collegeOrWorking}
                  onChange={(e) => handleInputChange("collegeOrWorking", e.target.value)}
                  borderWidth={2}
                  _focus={{ borderColor: "teal.500" }}
                >
                  <option value="">--Select--</option>
                  <option value="College">College</option>
                  <option value="Working">Working</option>
                </ChakraSelect>
                <FormErrorMessage>{errors.collegeOrWorking}</FormErrorMessage>
              </FormControl>
              {formData.collegeOrWorking === "Working" && (
                <FormControl isInvalid={!!errors.companyName}>
                  <FormLabel>Company Name <Text as="span" color="red.500">*</Text></FormLabel>
                  <Input
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "teal.500" }}
                  />
                  <FormErrorMessage>{errors.companyName}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.college}>
                  <FormLabel>College Name <Text as="span" color="red.500">*</Text></FormLabel>
                  <Box>
                    <Select
                      options={collegeOptions}
                      value={collegeOptions.find((opt) => opt.value === formData.college)}
                      onChange={(option) => handleInputChange("college", option?.value || "")}
                      placeholder="Select your college"
                      isClearable
                      styles={customSelectStyles}
                    />
                  </Box>
                  <FormErrorMessage>{errors.college}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.course}>
                  <FormLabel>Course <Text as="span" color="red.500">*</Text></FormLabel>
                  <Input
                    placeholder="e.g., B.Tech, MBA"
                    value={formData.course}
                    onChange={(e) => handleInputChange("course", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "teal.500" }}
                  />
                  <FormErrorMessage>{errors.course}</FormErrorMessage>
                </FormControl>
              )}
              {formData.collegeOrWorking === "College" && (
                <FormControl isInvalid={!!errors.year}>
                  <FormLabel>Year <Text as="span" color="red.500">*</Text></FormLabel>
                  <ChakraSelect
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    borderWidth={2}
                    _focus={{ borderColor: "teal.500" }}
                  >
                    <option value="">--Select Year--</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </ChakraSelect>
                  <FormErrorMessage>{errors.year}</FormErrorMessage>
                </FormControl>
              )}
              {/* Slot Input */}
              <FormControl isInvalid={!!errors.slot}>
                <FormLabel>Slot <Text as="span" color="red.500">*</Text></FormLabel>
                <Select
                  options={slotOptions}
                  value={slotOptions.find((opt) => opt.value === formData.slot)}
                  onChange={(option) => handleInputChange("slot", option?.value || "")}
                  placeholder="Select your slot"
                  isClearable
                  styles={customSelectStyles}
                />
                <FormErrorMessage>{errors.slot}</FormErrorMessage>
              </FormControl>
              <Button
                onClick={handlePayment}
                isLoading={isSubmitting}
                loadingText="Processing"
                bgGradient="linear(to-r, teal.500, #FFD700)"
                color="black"
                fontWeight="semibold"
                size="lg"
                py={6}
                w="full"
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
                disabled={isSubmitting}
                type="button"
              >
                Register Now for ₹49
              </Button>
              <Text textAlign="center" fontSize="md" mt={4} color="teal.600">
                For any queries, contact us at <Text as="a" href="mailto:krishnapulse@gmail.com" textDecoration="underline">krishnapulse@gmail.com</Text>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default Main;
