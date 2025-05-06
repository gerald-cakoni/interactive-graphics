var raytraceFS = `
struct Ray {
    vec3 pos;
    vec3 dir;
};

struct Material {
    vec3  k_d;  // diffuse coefficient
    vec3  k_s;  // specular coefficient
    float n;    // specular exponent
};

struct Sphere {
    vec3     center;
    float    radius;
    Material mtl;
};

struct Light {
    vec3 position;
    vec3 intensity;
};

struct HitInfo {
    float    t;
    vec3     position;
    vec3     normal;
    Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay(inout HitInfo hit, Ray ray) {
    hit.t = 1e30; // Initialize hit distance to a large value
    bool foundHit = false;

    for (int i = 0; i < NUM_SPHERES; ++i) {
        // Ray-sphere intersection
        vec3 oc = ray.pos - spheres[i].center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
            float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
            float t = min(t1, t2);

            if (t > 0.0 && t < hit.t) {
                hit.t = t;
                hit.position = ray.pos + t * ray.dir;
                hit.normal = normalize(hit.position - spheres[i].center);
                hit.mtl = spheres[i].mtl;
                foundHit = true;
            }
        }
    }

    return foundHit;
}

// Shades the given point and returns the computed color.
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
    vec3 color = vec3(0, 0, 0);

    for (int i = 0; i < NUM_LIGHTS; ++i) {
        // Shadow check
        Ray shadowRay;
        shadowRay.pos = position + normal * 0.001; // Offset to avoid self-intersection
        shadowRay.dir = normalize(lights[i].position - position);

        HitInfo shadowHit;
        bool inShadow = IntersectRay(shadowHit, shadowRay);

        if (!inShadow || shadowHit.t > length(lights[i].position - position)) {
            // Blinn-Phong shading
            vec3 lightDir = normalize(lights[i].position - position);
            vec3 halfDir = normalize(lightDir + view);

            float diff = max(dot(normal, lightDir), 0.0);
            float spec = pow(max(dot(normal, halfDir), 0.0), mtl.n);

            color += mtl.k_d * diff * lights[i].intensity;
            color += mtl.k_s * spec * lights[i].intensity;
        }
    }

    return color;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer(Ray ray) {
    HitInfo hit;
    if (IntersectRay(hit, ray)) {
        vec3 view = normalize(-ray.dir);
        vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

        // Compute reflections
        vec3 k_s = hit.mtl.k_s;
        for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
            if (bounce >= bounceLimit) break;
            if (hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0) break;

            // Initialize the reflection ray
            Ray r;
            r.pos = hit.position + hit.normal * 0.001; // Offset to avoid self-intersection
            r.dir = reflect(ray.dir, hit.normal);

            HitInfo h;
            if (IntersectRay(h, r)) {
                // Shade the hit point
                vec3 reflectionColor = Shade(h.mtl, h.position, h.normal, normalize(-r.dir));
                clr += k_s * reflectionColor;

                // Update for the next bounce
                k_s *= h.mtl.k_s;
                ray = r;
                hit = h;
            } else {
                // Use environment color
                clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
                break;
            }
        }

        return vec4(clr, 1); // Return the accumulated color, including reflections
    } else {
        return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0); // Return the environment color
    }
}
`;