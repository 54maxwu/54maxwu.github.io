<?php

function getOTP($key) {
  $cc = (int)(time() / 30);
  $key = strtoupper($key);
  list($t, $b, $r) = array("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", "", "");
  foreach(str_split($key) as $c) {
    $b = $b . sprintf("%05b", strpos($t, $c));
  }
  foreach(str_split($b, 8) as $c) {
    $r = $r . chr(bindec($c));
  }
  $c_byte = pack('N', 0) . pack('N', $cc);

  $hmac_sha1 = hash_hmac("sha1", $c_byte,$r);

  $offset = hexdec(substr($hmac_sha1, -1));
  $binary = hexdec(substr($hmac_sha1, $offset * 2, 8)) & 0x7fffffff;
  return substr($binary, -6);
}


$o = [
  "name" => "key",
];

foreach ($o as $key => $value) {
  echo "{$key} (".getOTP($value).")<p>";
}
