import { Formik, Form, Field } from "formik";

interface FormValues {
  repo: string;
  owner: string;
  path: string;
}

interface FileFormProps {
  onSubmit: (values: FormValues) => void;
}

export function FileForm(props: FileFormProps) {
  return (
    <Formik<FormValues>
      initialValues={{
        repo: "react-overflow-list",
        owner: "mattrothenberg",
        path: "README.md",
      }}
      onSubmit={async (values) => {
        props.onSubmit(values);
      }}
    >
      {(props) => {
        return (
          <Form>
            <Field placeholder="Repo" name="repo" />
            <Field placeholder="Owner" name="owner" />
            <Field placeholder="Path" name="path" />
            <button type="submit">Get File Contents</button>
          </Form>
        );
      }}
    </Formik>
  );
}
