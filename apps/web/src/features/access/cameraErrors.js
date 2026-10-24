/** Maps getUserMedia failures to a message key; the scan page always keeps manual entry available. */
export function cameraErrorKey(error, secureContext = typeof window === 'undefined' || window.isSecureContext !== false) {
  if (!secureContext) return 'scan.cam.insecure';
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'scan.cam.denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'NoCameraError':
      return 'scan.cam.notFound';
    default:
      return 'scan.cam.failed';
  }
}
