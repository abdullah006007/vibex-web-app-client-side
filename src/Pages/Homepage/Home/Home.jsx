import React from 'react';
import RightComponent from '../../../Component/RightSide/RightComponent';
import LeftSide from '../../../Component/LeftSide/LeftSide';
import MiddleCom from '../../../Component/Middle/MiddleCom';

const Home = () => {

    
    
    return (
        <div className='flex justify-around bg-buttonBg'>
            <section className='w-1/4 '>
            <LeftSide></LeftSide>
                
            </section>



            {/* middle section */}

            <section className='w-3/6'>
            <MiddleCom></MiddleCom>

            </section>



            <section className='w-1/5 '>
            <RightComponent></RightComponent>

            </section>
            
        </div>
    );
};

export default Home;