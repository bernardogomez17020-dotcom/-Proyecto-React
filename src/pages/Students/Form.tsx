import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GenericForm, { FormField } from '../../components/GenericForm';
import { studentService } from '../../services/studentService';
import { userService } from '../../services/userService';

const StudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Record<string, any> | undefined>();
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    userService.search({ role: 'STUDENT' }).then(users => {
      setFields([
        {
          name: 'user_id', label: 'Usuario', type: 'select', required: true,
          options: users.map(u => ({ value: u.id!, label: u.email! })),
        },
        { name: 'first_name', label: 'Nombre', type: 'text', required: true },
        { name: 'last_name', label: 'Apellido', type: 'text', required: true },
        { name: 'identification', label: 'Identificación', type: 'text', required: true },
      ]);
    });

    if (id) studentService.getById(id).then(data => data && setInitial(data));
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const result = id
      ? await studentService.update(id, values)
      : await studentService.create(values);
    return !!result;
  };

  return (
    <GenericForm
      title={id ? 'Editar Estudiante' : 'Crear Estudiante'}
      fields={fields}
      initialValues={initial}
      onSubmit={handleSubmit}
      backPath="/students/list"
    />
  );
};

export default StudentForm;
