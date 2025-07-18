import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Input,
  Flex,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Layout from "./component/Layout";

const CandidateExport = () => {
  const [data, setData] = useState([]);
  const [filteredCollege, setFilteredCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://vrc-server-110406681774.asia-south1.run.app/api/data")
      .then((res) => res.json())
      .then((candidates) => {
        setData(candidates);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data", err);
        setLoading(false);
      });
  }, []);
  console.log(data)
  const filterByDate = (candidate) => {
    if (!startDate && !endDate) return true;

    const candidateDate = new Date(candidate.registrationDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : null;

    if (start && candidateDate < start) return false;
    if (end && candidateDate > end) return false;
    return true;
  };

  const filteredData = data.filter((c) => {
    const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
    const dateMatch = filterByDate(c);
    return collegeMatch && dateMatch;
  });

  const uniqueColleges = [...new Set(data.map((c) => c.college))];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((row) => ({
        Name: row.name,
        Gender: row.gender,
        College: row.college,
        Phone: row.whatsappNumber,
        PaymentStatus: row.paymentStatus,
        Attendance: row.attendance ? "Yes" : "No",
        RegistrationDate: new Date(row.registrationDate).toLocaleDateString(),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "candidates.xlsx");
  };

  if (loading)
    return (<Layout><Spinner size="xl" mt="20" ml="auto" mr="auto" display="block" /></Layout>);

  return (
    <Layout>
    <Box p={6}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="lg">Candidate List</Heading>
        <Button colorScheme="blue" onClick={() => navigate("/admin/attendance")}>
          Go to Attendance
        </Button>
      </Box>

      <Flex gap={6} mb={4} wrap="wrap">
        <FormControl width="200px">
          <FormLabel>Filter by College</FormLabel>
          <Select
            placeholder="Select College"
            onChange={(e) => setFilteredCollege(e.target.value)}
            value={filteredCollege}
          >
            {uniqueColleges.map((college, i) => (
              <option key={i} value={college}>
                {college}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl width="200px">
          <FormLabel>From Date</FormLabel>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FormControl>

        <FormControl width="200px">
          <FormLabel>To Date</FormLabel>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormControl>
      </Flex>

      <Button colorScheme="teal" mb={4} onClick={exportToExcel}>
        Export to Excel
      </Button>

      <Table variant="striped" size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Gender</Th>
            <Th>Course</Th>
            <Th>Phone</Th>
            <Th>Payment</Th>
            <Th>College/Working</Th>
            <Th>Slot</Th>
            <Th>Company</Th>
            <Th>Registration Date</Th>
            
          </Tr>
        </Thead>
        <Tbody>
          {filteredData.map((candidate, idx) => (
            <Tr key={idx}>
              <Td>{candidate.name}</Td>
              <Td>{candidate.gender}</Td>
              <Td>{candidate.course}</Td>
              <Td>{candidate.whatsappNumber}</Td>
              <Td>{candidate.paymentStatus}</Td>
              <Td>{candidate.collegeOrWorking}</Td>
              <Td>{candidate.slot}</Td>
              <Td>{candidate.companyName}</Td>
              <Td>
                {candidate.registrationDate
                  ? new Date(candidate.registrationDate).toLocaleDateString()
                  : "N/A"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
    </Layout>
  );
};

export default CandidateExport;
