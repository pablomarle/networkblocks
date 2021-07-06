class WGL_GEOMETRY {
    static create_geometry(vertex, faces, uvs) {
        let position = [];
        let computed_uvs = [];

        for(const face of faces) {
            for(let x = 0; x < 3; x++) {
                position.push(vertex[face[x]][0]);
                position.push(vertex[face[x]][1]);
                position.push(vertex[face[x]][2]);
            }
        }
        for(const face_uvs of uvs) {
            for(const uv of face_uvs) {
                computed_uvs.push(uv[0])
                computed_uvs.push(uv[1])
            }
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(position), 3));
        geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(computed_uvs), 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    static cube(w=1, h=1, d=1) {
        let w2 = w/2, h2 = h/2, d2 = d/2;
        let geometry_data = {
            v: [
                [-w2,-h2,-d2], [w2,-h2,-d2],[w2, h2, -d2], [-w2,h2,-d2],
                [-w2,-h2,d2], [w2,-h2,d2],[w2, h2, d2], [-w2,h2,d2],
            ],
            i: [
                [0,1,2], [0,2,3], [4,5,6], [4,6,7],
                [0,1,5], [0,5,4], [1,2,6], [1,6,5], [2,3,7], [2,7,6], [3,0,4], [3,4,7],
            ],
            uv: [
                [[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]],
            ],
        };

        return this.create_geometry(geometry_data.v, geometry_data.i, geometry_data.uv);
    }
}