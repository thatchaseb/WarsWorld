import SquareButton from "../layout/SquareButton";
import FormInput from "../layout/FormInput";
import { FormEvent, useState } from "react";

interface Props {
  onSubmitEndBehaviour: () => void;
}

export default function SignupForm({ onSubmitEndBehaviour }: Props) {
  const [signupData, setSignupData] = useState({
    user: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const onChangeGenericHandler = (identifier: string, value: string) => {
    setSignupData((prevData) => ({
      ...prevData,
      [identifier]: value,
    }));
  };

  const onSubmitSignupForm = (event: FormEvent) => {
    event.preventDefault();
    console.log("SUBMMIT");
    console.log(signupData);
    onSubmitEndBehaviour();
  };

  return (
    <>
      <form className="@flex @flex-col @gap-6">
        <FormInput
          key="su-email"
          text="Email:"
          id="email"
          type="email"
          value={signupData.email}
          onChange={(event) =>
            onChangeGenericHandler(
              "email",
              (event.target as HTMLInputElement).value
            )
          }
        />
        <FormInput
          key="su-user"
          text="Username:"
          id="username"
          type="text"
          value={signupData.user}
          onChange={(event) =>
            onChangeGenericHandler(
              "user",
              (event.target as HTMLInputElement).value
            )
          }
        />
        <FormInput
          key="su-password"
          text="Password:"
          id="password"
          type="password"
          value={signupData.password}
          onChange={(event) =>
            onChangeGenericHandler(
              "password",
              (event.target as HTMLInputElement).value
            )
          }
        />
        <FormInput
          key="su-con-password"
          text="Confirm password:"
          id="password"
          type="password"
          value={signupData.confirmPassword}
          onChange={(event) =>
            onChangeGenericHandler(
              "confirmPassword",
              (event.target as HTMLInputElement).value
            )
          }
        />
        <div className="@flex @flex-col @items-center @justify-center @pb-2 @px-10 @gap-2">
          <div className="@w-96 @h-16 @text-3xl @my-2">
            <SquareButton onClick={onSubmitSignupForm}>Signup</SquareButton>
          </div>
        </div>
      </form>
    </>
  );
}
