import { Dialog } from "@headlessui/react";
import { Dispatch, SetStateAction, useState } from "react";
import DefaultDialogDesign from "../layout/modal/DefaultDialogDesign";
import SquareButton from "../layout/SquareButton";
import Link from "next/link";
import LoginForm from "../auth/LoginForm";
import SignupForm from "../auth/SignupForm";

interface Props {
  width?: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function LoginModal({ isOpen, setIsOpen, width }: Props) {
  const [isSignupForm, setIsSignupForm] = useState(false);

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="@relative @z-40"
      >
        {isSignupForm ? (
          /* SIGNUP */
          <DefaultDialogDesign title="Signup" width={width ?? "50vw"}>
            <div className="@pt-8 @px-10">
              <SignupForm setIsModalOpen={setIsOpen} />
              <div className="@flex @flex-col @items-center @justify-center @pb-6 @px-10 @gap-2">
                <div className="@h-[0.15rem] @w-full @bg-bg-primary @my-2" />
                <p>Already have an account?</p>
                <div className="@my-2 @w-80 @h-12 @text-2xl">
                  <SquareButton onClick={() => setIsSignupForm(false)}>
                    Log in
                  </SquareButton>
                </div>
              </div>
            </div>
          </DefaultDialogDesign>
        ) : (
          /* LOGIN */
          <DefaultDialogDesign title="Login" width={width ?? "50vw"}>
            <div className="@pt-8 @px-10">
              <LoginForm setIsModalOpen={setIsOpen} />
              <div className="@flex @flex-col @items-center @justify-center @pb-6 @px-10 @gap-2">
                <Link
                  className="@my-2"
                  href="."
                  onClick={() => setIsOpen(false)}
                >
                  Forgot password?
                </Link>
                <div className="@h-[0.15rem] @w-full @bg-bg-primary @my-2" />
                <p>Don&apos;t have an account?</p>
                <div className="@my-2 @w-80 @h-12 @text-2xl">
                  <SquareButton onClick={() => setIsSignupForm(true)}>
                    Create New Account
                  </SquareButton>
                </div>
              </div>
            </div>
          </DefaultDialogDesign>
        )}
      </Dialog>
    </>
  );
}
