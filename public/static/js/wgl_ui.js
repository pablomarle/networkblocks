class WGL_UI {
    /* **************************************************************************
     * Function to create a 3d menu
     * parameters:
     * - menu_px, menu_py, menu_pz : coordinates where the menu will be shown
     * - radius:
     * - menu: list of items where each item is a menu element containing:
     *      - name : text shown
     *      - geometry : mesh to use below the text
     *      - texture_name : if null, no texture will be used
     *      - color
     *      - suboptions: list of suboptions
     *          - name: name
     *          - geometry: mesh to the left
     *          - texture_name
     *          - color
     *          - action: action to take
     *      - action : function to call when clicked 
     */
    static create_menu(wgl, menu, menu_px, menu_py, menu_pz, radius) {
        let group = new THREE.Group();
        group.position.set(menu_px, menu_py, menu_pz);

        for(let i = 0; i < menu.length; i++) {
            let item = menu[i];
            let px = Math.cos(i/(menu.length-1) * Math.PI) * radius;
            let py = 0;
            let pz = Math.sin(-i/(menu.length-1) * Math.PI) * radius;

            let material;
            if(item.texture_name) {
                console.log("Texture names not yet implemented.");
                material = new THREE.MeshPhongMaterial( { color:  item.color } );
            }
            else {
                material = new THREE.MeshPhongMaterial( { color:  item.color } );
            }
            let mesh = new THREE.Mesh(item.geometry, material);
            mesh.position.set(px, py, pz);
            group.add(mesh);
        }
        wgl.add_to_scene(group);
    }
}