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
  const [paymentEdits, setPaymentEdits] = useState({});

  const navigate = useNavigate();
const [filteredPaymentStatus, setFilteredPaymentStatus] = useState("");

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
  const confirmAndUpdate = (id, status) => {
  if (window.confirm(`Are you sure you want to update the payment status to "${status}"?`)) {
    updatePaymentStatus(id, status);
  }
};
const confirmAndDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this candidate?")) {
    try {
      const res = await fetch(
        `https://vrc-server-110406681774.asia-south1.run.app/api/delete-candidate/${id}`,
        {
          method: "DELETE",
        }
      );
      const dataRes = await res.json();

      if (res.ok) {
        alert("Candidate deleted successfully!");
        // Remove from local state
        setData((prev) => prev.filter((c) => c._id !== id));
      } else {
        alert("Delete failed: " + dataRes.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed due to server/network issue.");
    }
  }
};

const updatePaymentStatus = async (id, status) => {
  try {
    const res = await fetch(`https://vrc-server-110406681774.asia-south1.run.app/api/update-payment/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentStatus: status }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Payment status updated successfully!");
    } else {
      alert("Failed to update: " + data.message);
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Update failed due to network/server error.");
  }
};

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

  // const filteredData = data.filter((c) => {
  //   const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
  //   const dateMatch = filterByDate(c);
  //   return collegeMatch && dateMatch;
  // });
const filteredData = data.filter((c) => {
  const collegeMatch = filteredCollege ? c.college === filteredCollege : true;
  const dateMatch = filterByDate(c);
  const paymentMatch = filteredPaymentStatus ? c.paymentStatus === filteredPaymentStatus : true;
  return collegeMatch && dateMatch && paymentMatch;
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
  <FormLabel>Payment Status</FormLabel>
  <Select
    placeholder="Select Status"
    value={filteredPaymentStatus}
    onChange={(e) => setFilteredPaymentStatus(e.target.value)}
  >
    <option value="Paid">Paid</option>
    <option value="Pending">Pending</option>
    <option value="Failed">Failed</option>
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
    <Box mb={2} fontWeight="bold">
  Total Records: {filteredData.length}
</Box>

      <Table variant="striped" size="sm">
        <Thead>
          <Tr>
             <Th>S. No.</Th>
            <Th>Name</Th>
            <Th>Gender</Th>
            <Th>Course</Th>
            <Th>Phone</Th>
            <Th>Payment</Th>
            <Th>College/Working</Th>
            <Th>Slot</Th>
            <Th>Company/College</Th>
            <Th>Registration Date</Th>
           

          </Tr>
        </Thead>
        <Tbody>
          {filteredData.map((candidate, idx) => (
            <Tr key={idx}>
              <Td>{idx + 1}</Td>
              <Td>{candidate.name}</Td>
              <Td>{candidate.gender}</Td>
              <Td>{candidate.course}</Td>
              <Td>{candidate.whatsappNumber}</Td>
             <Td>
<Flex align="center" gap={2}>
  <Select
    size="sm"
    value={paymentEdits[candidate._id] ?? candidate.paymentStatus}
    onChange={(e) =>
      setPaymentEdits((prev) => ({
        ...prev,
        [candidate._id]: e.target.value,
      }))
    }
    width="100px"
  >
    <option value="Paid">Paid</option>
    <option value="Pending">Pending</option>
    <option value="Failed">Failed</option>
  </Select>

  <Button
    size="sm"
    colorScheme="green"
    onClick={() =>
      confirmAndUpdate(candidate._id, paymentEdits[candidate._id] ?? candidate.paymentStatus)
    }
  >
    Update
  </Button>
</Flex>

</Td>

              <Td>{candidate.collegeOrWorking}</Td>
              <Td>{candidate.slot}</Td>
              <Td>{candidate.college ===''? candidate.companyName:candidate.college}</Td>
              <Td>
                {candidate.registrationDate
                  ? new Date(candidate.registrationDate).toLocaleDateString()
                  : "N/A"}
              </Td>
              <Td>
  <Button
    size="sm"
    colorScheme="red"
    onClick={() => confirmAndDelete(candidate._id)}
  >
    Delete
  </Button>
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
