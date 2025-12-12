import "./InputField.css";

type Props = {
  id?: string;
  name?: string;
  placeholder: string;
  type?: string;
  value: string;
  maxLength?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
};

export default function InputField({
  id,
  placeholder,
  type = "text",
  value,
  maxLength,
  onChange,
  error = false,
}: Props) {
  return (
    <input
      id={id}
      className={`input-field ${error ? "input-error" : ""}`}
      type={type}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
