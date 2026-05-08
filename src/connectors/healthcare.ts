export const HealthcareConnector = {
  id: "healthcare",
  adapterType: "c-proc",
  schemaVersion: "2.1.0",
  async fetch(resource: string, params: Record<string, string>) {
    return [
      { patient_id: "P001", mrn: "MRN001", last_name: "Smith", first_name: "John", dob: "1980-01-15", gender: "M" },
      { patient_id: "P002", mrn: "MRN002", last_name: "Doe", first_name: "Jane", dob: "1990-06-20", gender: "F" },
    ];
  },
  normalise(raw: any) {
    return {
      patientId: raw.patient_id,
      mrn: raw.mrn?.trim(),
      name: {
        family: raw.last_name,
        given: raw.first_name,
      },
      birthDate: raw.dob,
      gender: raw.gender,
    };
  },
};
