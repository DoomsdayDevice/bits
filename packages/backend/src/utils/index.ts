export * from "./fs";
export * from "./dto";
export * from "./crypt";
export * from "./reflectors";

export const getIpFromReq = (req: any) => {
  const { ip, headers } = req;
  const forwardIp = headers["x-forwarded-for"];
  const realIp = headers["x-real-ip"];

  let finalIp: string;

  if (ip.substr(0, 7) === "::ffff:") {
    finalIp = ip.substr(7);
    if (forwardIp || realIp) finalIp = forwardIp || realIp;
  } else finalIp = ip;

  return finalIp;
};
