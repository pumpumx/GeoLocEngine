type LocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type SmoothedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export class UberLikeLocationTracker {
  private samples: LocationPoint[] = [];
  private readonly maxSamples = 20;

  private watchId: number | null = null;

  // Kalman state
  private latEstimate: number | null = null;
  private lngEstimate: number | null = null;

  private latError = 1;
  private lngError = 1;

  private readonly processNoise = 0.00001;
  private readonly measurementNoise = 0.0001;

  start(
    onLocationUpdate: (location: SmoothedLocation) => void,
    onError?: (error: GeolocationPositionError) => void
  ) {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported");
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: LocationPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        this.addSample(point);

        const smoothed = this.getSmoothedLocation();

        if (smoothed) {
          onLocationUpdate(smoothed);
        }
      },
      (error) => {
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private addSample(point: LocationPoint) {
    // Reject poor GPS fixes
    if (point.accuracy > 50) {
      return;
    }

    const last = this.samples[this.samples.length - 1];

    if (last) {
      const distance = this.distanceMeters(
        last.latitude,
        last.longitude,
        point.latitude,
        point.longitude
      );

      const timeDiff =
        (point.timestamp - last.timestamp) / 1000;

      if (timeDiff > 0) {
        const speed = distance / timeDiff;

        // Reject impossible jumps (> 150 km/h)
        if (speed > 42) {
          return;
        }
      }
    }

    this.samples.push(point);

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  private getSmoothedLocation():
    | SmoothedLocation
    | null {
    if (this.samples.length < 3) {
      return null;
    }

    const weighted = this.weightedAverage();

    return {
      latitude: this.kalman(
        weighted.latitude,
        "lat"
      ),
      longitude: this.kalman(
        weighted.longitude,
        "lng"
      ),
      accuracy: weighted.accuracy,
    };
  }

  private weightedAverage(): SmoothedLocation {
    let latSum = 0;
    let lngSum = 0;
    let accSum = 0;
    let totalWeight = 0;

    for (const sample of this.samples) {
      const weight =
        1 / Math.max(sample.accuracy, 1);

      latSum += sample.latitude * weight;
      lngSum += sample.longitude * weight;
      accSum += sample.accuracy * weight;

      totalWeight += weight;
    }

    return {
      latitude: latSum / totalWeight,
      longitude: lngSum / totalWeight,
      accuracy: accSum / totalWeight,
    };
  }

  private kalman(
    measurement: number,
    axis: "lat" | "lng"
  ): number {
    if (axis === "lat") {
      if (this.latEstimate === null) {
        this.latEstimate = measurement;
        return measurement;
      }

      this.latError += this.processNoise;

      const gain =
        this.latError /
        (this.latError +
          this.measurementNoise);

      this.latEstimate =
        this.latEstimate +
        gain *
          (measurement -
            this.latEstimate);

      this.latError =
        (1 - gain) * this.latError;

      return this.latEstimate;
    }

    if (this.lngEstimate === null) {
      this.lngEstimate = measurement;
      return measurement;
    }

    this.lngError += this.processNoise;

    const gain =
      this.lngError /
      (this.lngError +
        this.measurementNoise);

    this.lngEstimate =
      this.lngEstimate +
      gain *
        (measurement -
          this.lngEstimate);

    this.lngError =
      (1 - gain) * this.lngError;

    return this.lngEstimate;
  }

  private distanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;

    const dLat =
      ((lat2 - lat1) * Math.PI) / 180;

    const dLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return (
      2 *
      R *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      )
    );
  }
}